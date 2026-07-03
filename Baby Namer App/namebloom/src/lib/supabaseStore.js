// Real multi-device backend using Supabase (auth + Postgres + realtime).
// Exposes the same interface as demoStore so the UI never branches on backend.
import { supabase, supabaseConfigProblem } from "./supabase.js";

// Turn low-level fetch/JSON failures into a message a human can act on.
function friendlyAuthError(e) {
  const msg = (e && e.message) || String(e);
  const looksLikeHtml = /not valid JSON|Unexpected token|<!DOCTYPE|Failed to fetch|NetworkError/i.test(msg);
  if (looksLikeHtml) {
    const hint = supabaseConfigProblem();
    return new Error(
      (hint ? hint + " " : "Couldn't reach the server. ") +
      "Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify, then Clear cache and deploy."
    );
  }
  return e instanceof Error ? e : new Error(msg);
}

let _cachedProfile = null;

async function profileFor(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!data) return null;
  return { id: data.id, name: data.name, email: data.email, partnerId: data.partner_id };
}

export const supabaseStore = {
  mode: "supabase",

  // ---------- auth ----------
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { _cachedProfile = null; return null; }
    _cachedProfile = await profileFor(user.id);
    return _cachedProfile;
  },
  currentUser() { return _cachedProfile; },

  async signUp({ name, email, password }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      // profile row is created by a DB trigger; return best-effort
      if (data.user) return { id: data.user.id, name, email, partnerId: null };
      return null;
    } catch (e) {
      throw friendlyAuthError(e);
    }
  },
  async signIn({ email, password }) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return this.getCurrentUser();
    } catch (e) {
      throw friendlyAuthError(e);
    }
  },
  async signOut() {
    await supabase.auth.signOut();
    _cachedProfile = null;
  },

  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange(() => cb());
    return () => data.subscription.unsubscribe();
  },

  // ---------- partner ----------
  async findByEmail(email) {
    const { data } = await supabase.from("profiles").select("*").ilike("email", email).maybeSingle();
    return data ? { id: data.id, name: data.name, email: data.email, partnerId: data.partner_id } : null;
  },
  async setPartner(_partnerId, email) {
    // Mutual link handled server-side to satisfy row security.
    const { error } = await supabase.rpc("link_partner", { partner_email: email });
    if (error) throw error;
    return this.getPartner();
  },
  async getPartner() {
    const me = await this.getCurrentUser();
    if (!me?.partnerId) return null;
    return profileFor(me.partnerId);
  },

  // ---------- projects ----------
  async listProjects() {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    return (data || []).map(rowToProject);
  },
  async createProject(input) {
    const { data, error } = await supabase.rpc("create_project", {
      p_name: input.name,
      p_surname: input.surname || "",
      p_gender: input.genderFilter || "all",
      p_included: input.includedCultures || [],
      p_favorite: input.favoriteCultures || [],
      p_target: input.targetMatches || 100,
    });
    if (error) throw error;
    return this.getProject(data);
  },
  async getProject(id) {
    const { data } = await supabase.from("projects").select("*").eq("id", id).single();
    return data ? rowToProject(data) : null;
  },
  async updateProject(id, patch) {
    const row = {};
    if (patch.name != null) row.name = patch.name;
    if (patch.surname != null) row.surname = patch.surname;
    if (patch.genderFilter != null) row.gender_filter = patch.genderFilter;
    if (patch.includedCultures != null) row.included_cultures = patch.includedCultures;
    if (patch.favoriteCultures != null) row.favorite_cultures = patch.favoriteCultures;
    const { data } = await supabase.from("projects").update(row).eq("id", id).select().single();
    return rowToProject(data);
  },
  async projectMembers(id) {
    const { data } = await supabase
      .from("project_members")
      .select("profiles(id,name,email,partner_id)")
      .eq("project_id", id);
    return (data || []).map((r) => ({
      id: r.profiles.id, name: r.profiles.name, email: r.profiles.email, partnerId: r.profiles.partner_id,
    }));
  },
  async deleteProject(id) {
    // Child rows (members, swipes, finalists, vetoes) are removed automatically
    // by the ON DELETE CASCADE foreign keys. Requires the projects_delete RLS policy.
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  },

  // ---------- swipes ----------
  async addSwipe(projectId, nameId, liked, superliked = false) {
    const me = this.currentUser();
    await supabase.from("swipes").upsert(
      { project_id: projectId, user_id: me.id, name_id: nameId, liked, superliked },
      { onConflict: "project_id,user_id,name_id" }
    );
  },
  async mySwipedIds(projectId) {
    const me = this.currentUser();
    const { data } = await supabase.from("swipes").select("name_id").eq("project_id", projectId).eq("user_id", me.id);
    return new Set((data || []).map((r) => r.name_id));
  },
  async allSwipes(projectId) {
    const { data } = await supabase.from("swipes").select("*").eq("project_id", projectId);
    return (data || []).map((r) => ({
      projectId: r.project_id, userId: r.user_id, nameId: r.name_id, liked: r.liked, superliked: r.superliked,
    }));
  },

  // ---------- finalists ----------
  async toggleFinalist(projectId, nameId) {
    const me = this.currentUser();
    const { data } = await supabase.from("finalists")
      .select("*").eq("project_id", projectId).eq("user_id", me.id).eq("name_id", nameId).maybeSingle();
    if (data) await supabase.from("finalists").delete().eq("project_id", projectId).eq("user_id", me.id).eq("name_id", nameId);
    else await supabase.from("finalists").insert({ project_id: projectId, user_id: me.id, name_id: nameId });
  },
  async listFinalists(projectId) {
    const { data } = await supabase.from("finalists").select("*").eq("project_id", projectId);
    return (data || []).map((r) => ({ projectId: r.project_id, userId: r.user_id, nameId: r.name_id }));
  },

  // ---------- vetoes ----------
  async toggleVeto(projectId, nameId) {
    const me = this.currentUser();
    const { data } = await supabase.from("vetoes")
      .select("*").eq("project_id", projectId).eq("user_id", me.id).eq("name_id", nameId).maybeSingle();
    if (data) await supabase.from("vetoes").delete().eq("project_id", projectId).eq("user_id", me.id).eq("name_id", nameId);
    else await supabase.from("vetoes").insert({ project_id: projectId, user_id: me.id, name_id: nameId });
  },
  async listVetoes(projectId) {
    const { data } = await supabase.from("vetoes").select("*").eq("project_id", projectId);
    return (data || []).map((r) => ({ projectId: r.project_id, userId: r.user_id, nameId: r.name_id }));
  },

  // ---------- realtime ----------
  subscribeProject(projectId, cb) {
    const ch = supabase
      .channel(`project-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "swipes", filter: `project_id=eq.${projectId}` }, cb)
      .on("postgres_changes", { event: "*", schema: "public", table: "finalists", filter: `project_id=eq.${projectId}` }, cb)
      .on("postgres_changes", { event: "*", schema: "public", table: "vetoes", filter: `project_id=eq.${projectId}` }, cb)
      .subscribe();
    return () => supabase.removeChannel(ch);
  },
};

function rowToProject(r) {
  return {
    id: r.id,
    seedId: r.seed_id,
    name: r.name,
    surname: r.surname || "",
    genderFilter: r.gender_filter || "all",
    includedCultures: r.included_cultures || [],
    favoriteCultures: r.favorite_cultures || [],
    targetMatches: r.target_matches || 100,
    ownerId: r.owner_id,
    createdAt: new Date(r.created_at).getTime(),
  };
}
