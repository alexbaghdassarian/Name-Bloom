// Single-device demo backend. Persists to localStorage and mirrors the shape of
// the Supabase adapter so the UI code is identical either way. Because there is
// no server, this lets ONE person play both partners via a "switch partner"
// toggle — perfect for trying the flow before wiring up Supabase.

const DB_KEY = "namebloom_demo_db_v1";
const SESSION_KEY = "namebloom_demo_session_v1";

const uid = () => Math.random().toString(36).slice(2, 10);

function load() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || fresh();
  } catch {
    return fresh();
  }
}
function fresh() {
  return { users: [], projects: [], swipes: [], finalists: [], vetoes: [] };
}
function save(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  emit();
}

// --- tiny realtime emitter (same-tab listeners + cross-tab storage events) ---
const listeners = new Set();
function emit() {
  listeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === DB_KEY) emit();
  });
}

function session() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; }
  catch { return {}; }
}
function setSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  emit();
}

export const demoStore = {
  mode: "demo",

  // ---------- auth ----------
  currentUser() {
    const s = session();
    if (!s.userId) return null;
    return load().users.find((u) => u.id === s.userId) || null;
  },
  async getCurrentUser() { return this.currentUser(); },
  async signUp({ name, email }) {
    const db = load();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error("An account with that email already exists here. Try switching to it instead.");
    const user = { id: uid(), name: name.trim(), email: email.trim(), partnerId: null };
    db.users.push(user);
    save(db);
    setSession({ userId: user.id });
    return user;
  },
  async signIn({ email }) {
    const db = load();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("No account here with that email yet. Create one first.");
    setSession({ userId: user.id });
    return user;
  },
  async signOut() {
    setSession({});
  },

  // demo-only helpers for the "switch partner" affordance
  listUsers() { return load().users; },
  switchTo(userId) { setSession({ userId }); },

  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  // ---------- profiles / partner ----------
  async findByEmail(email) {
    return load().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  async setPartner(partnerId) {
    const db = load();
    const me = this.currentUser();
    const partner = db.users.find((u) => u.id === partnerId);
    if (!me || !partner) throw new Error("Could not link partner.");
    me.partnerId = partner.id;
    partner.partnerId = me.id; // mutual link
    save(db);
    return partner;
  },
  async getPartner() {
    const me = this.currentUser();
    if (!me?.partnerId) return null;
    return load().users.find((u) => u.id === me.partnerId) || null;
  },

  // ---------- projects ----------
  async listProjects() {
    const me = this.currentUser();
    if (!me) return [];
    return load().projects
      .filter((p) => p.memberIds.includes(me.id))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  async createProject(input) {
    const db = load();
    const me = this.currentUser();
    const partner = me.partnerId ? db.users.find((u) => u.id === me.partnerId) : null;
    const project = {
      id: uid(),
      seedId: uid(),
      name: input.name,
      surname: input.surname || "",
      genderFilter: input.genderFilter || "all",
      includedCultures: input.includedCultures || [],
      favoriteCultures: input.favoriteCultures || [],
      targetMatches: input.targetMatches || 100,
      ownerId: me.id,
      memberIds: [me.id, ...(partner ? [partner.id] : [])],
      createdAt: Date.now(),
    };
    db.projects.push(project);
    save(db);
    return project;
  },
  async getProject(id) {
    return load().projects.find((p) => p.id === id) || null;
  },
  async updateProject(id, patch) {
    const db = load();
    const p = db.projects.find((x) => x.id === id);
    Object.assign(p, patch);
    save(db);
    return p;
  },
  async projectMembers(id) {
    const db = load();
    const p = db.projects.find((x) => x.id === id);
    return p.memberIds.map((mid) => db.users.find((u) => u.id === mid)).filter(Boolean);
  },

  // ---------- swipes ----------
  async addSwipe(projectId, nameId, liked, superliked = false) {
    const db = load();
    const me = this.currentUser();
    const idx = db.swipes.findIndex(
      (s) => s.projectId === projectId && s.userId === me.id && s.nameId === nameId
    );
    const row = { projectId, userId: me.id, nameId, liked, superliked, at: Date.now() };
    if (idx >= 0) db.swipes[idx] = row;
    else db.swipes.push(row);
    save(db);
  },
  async mySwipedIds(projectId) {
    const me = this.currentUser();
    return new Set(
      load().swipes.filter((s) => s.projectId === projectId && s.userId === me.id).map((s) => s.nameId)
    );
  },
  async allSwipes(projectId) {
    return load().swipes.filter((s) => s.projectId === projectId);
  },

  // ---------- finalists (nominate a matched name) ----------
  async toggleFinalist(projectId, nameId) {
    const db = load();
    const me = this.currentUser();
    const i = db.finalists.findIndex((f) => f.projectId === projectId && f.userId === me.id && f.nameId === nameId);
    if (i >= 0) db.finalists.splice(i, 1);
    else db.finalists.push({ projectId, userId: me.id, nameId });
    save(db);
  },
  async listFinalists(projectId) {
    return load().finalists.filter((f) => f.projectId === projectId);
  },

  // ---------- vetoes ----------
  async toggleVeto(projectId, nameId) {
    const db = load();
    const me = this.currentUser();
    const i = db.vetoes.findIndex((v) => v.projectId === projectId && v.userId === me.id && v.nameId === nameId);
    if (i >= 0) db.vetoes.splice(i, 1);
    else db.vetoes.push({ projectId, userId: me.id, nameId });
    save(db);
  },
  async listVetoes(projectId) {
    return load().vetoes.filter((v) => v.projectId === projectId);
  },

  // ---------- realtime ----------
  subscribeProject(_projectId, cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
