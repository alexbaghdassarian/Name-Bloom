import { createClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Supabase mode is active whenever both env vars are present.
export const isSupabaseConfigured = Boolean(rawUrl && key);
export const supabaseUrl = rawUrl;

// Structural check so we can flag an obviously-wrong value before any request.
export function supabaseConfigProblem() {
  if (!isSupabaseConfigured) return null;
  if (rawUrl.startsWith("eyJ") || rawUrl.split(".").length > 4) {
    return "Your Supabase URL looks like the anon key — the URL and key appear swapped in Netlify.";
  }
  if (key.startsWith("http")) {
    return "Your anon key looks like a URL — the URL and key appear swapped in Netlify.";
  }
  let parsed;
  try { parsed = new URL(rawUrl); }
  catch { return "Your Supabase URL isn't a valid web address. It should look like https://YOURPROJECT.supabase.co (Supabase → Project Settings → API → Project URL)."; }
  if (parsed.protocol !== "https:") return "Your Supabase URL should start with https://";
  if (parsed.hostname.includes("supabase.com")) {
    return "That looks like the Supabase dashboard URL. Use the Project URL from Settings → API instead — it looks like https://YOURPROJECT.supabase.co";
  }
  return null;
}

// Live connectivity probe. Hits GoTrue's public health endpoint and interprets
// the result into plain-English guidance. Returns { ok, kind, detail }.
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return { ok: false, kind: "unconfigured", detail: "No Supabase URL/key detected — the app is in Demo Mode. Add both env vars in Netlify and redeploy." };
  }
  const structural = supabaseConfigProblem();
  if (structural) return { ok: false, kind: "config", detail: structural };

  const endpoint = rawUrl.replace(/\/+$/, "") + "/auth/v1/health";
  let res;
  try {
    res = await fetch(endpoint, { headers: { apikey: key } });
  } catch {
    return {
      ok: false, kind: "network",
      detail: "Couldn't reach that URL at all. Either the host is misspelled, or the Supabase project is paused. Open your Supabase dashboard — if the project shows \u201cPaused,\u201d resume it, and confirm the Project URL matches exactly.",
    };
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html")) {
    return {
      ok: false, kind: "html",
      detail: "That URL returned a web page, not the Supabase API — so it's the wrong URL (often the Netlify site or the dashboard link). Use Project Settings \u2192 API \u2192 Project URL (https://YOURPROJECT.supabase.co).",
    };
  }
  if (res.status === 401) {
    return { ok: false, kind: "key", detail: "The URL is reachable but the anon key was rejected. Re-copy the \u201canon public\u201d key from Project Settings \u2192 API." };
  }
  if (!res.ok) {
    return { ok: false, kind: "http", detail: `The server responded with status ${res.status}. If the project is paused, resume it in the Supabase dashboard, then try again.` };
  }
  return { ok: true, kind: "ok", detail: "Connected to Supabase. You can create an account." };
}

// Always log the resolved URL (key masked) so the exact value is verifiable.
if (isSupabaseConfigured) {
  console.info("[NameBloom] Supabase URL in use:", rawUrl, "| anon key:", key.slice(0, 6) + "\u2026" + key.slice(-4));
  const p = supabaseConfigProblem();
  if (p) console.error("[NameBloom] Supabase config issue:", p);
}

export const supabase = isSupabaseConfigured ? createClient(rawUrl, key) : null;
