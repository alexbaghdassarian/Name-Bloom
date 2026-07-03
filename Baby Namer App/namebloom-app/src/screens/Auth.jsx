import { useEffect, useState } from "react";
import { store, DEMO } from "../lib/api.js";
import { testSupabaseConnection, isSupabaseConfigured } from "../lib/supabase.js";

export default function Auth({ onDone }) {
  const [conn, setConn] = useState(null); // { ok, kind, detail } | null while checking

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    testSupabaseConnection().then((r) => { if (alive) setConn(r); });
    return () => { alive = false; };
  }, []);
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      if (mode === "signup") await store.signUp({ name, email, password });
      else await store.signIn({ email, password });
      await onDone();
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rise" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ padding: "18px 4px 22px" }}>
        <p className="eyebrow">A naming journey for two</p>
        <h1 className="display" style={{ fontSize: 40, fontWeight: 600, margin: "8px 0 10px" }}>
          Find the name<br />you'll both love.
        </h1>
        <p className="muted" style={{ fontSize: 16, lineHeight: 1.5 }}>
          Swipe through names from around the world. When you and your partner land on the same one, it blooms into a match.
        </p>
      </div>

      <div className="panel" style={{ padding: 20 }}>
        {isSupabaseConfigured && (
          conn == null ? (
            <div className="cfg-note" role="status"><span className="cfg-dot checking" /> Checking connection to your server…</div>
          ) : conn.ok ? (
            <div className="cfg-note ok" role="status"><span className="cfg-dot good" /> {conn.detail}</div>
          ) : (
            <div className="cfg-warn" role="alert">
              <strong>Can't reach your Supabase project</strong>
              <span>{conn.detail}</span>
              <span className="cfg-sub">After fixing it in Netlify, run <em>Clear cache and deploy site</em>.</span>
            </div>
          )
        )}
        <div className="seg">
          <button data-on={mode === "signup"} onClick={() => setMode("signup")}>Create account</button>
          <button data-on={mode === "signin"} onClick={() => setMode("signin")}>Sign in</button>
        </div>

        {mode === "signup" && (
          <label className="field">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam" autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" autoComplete="email" />
        </label>
        {!DEMO && (
          <label className="field">
            <span>Password</span>
            <div className="pw-wrap">
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="••••••••" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} aria-pressed={showPw}>
                {showPw ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </label>
        )}

        {err && <p style={{ color: "var(--coral-deep)", fontSize: 14, margin: "2px 4px 12px", fontWeight: 600 }}>{err}</p>}

        <button className="btn btn-coral" disabled={busy || !email || (mode === "signup" && !name)} onClick={submit}>
          {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </div>

      {DEMO && (
        <p className="muted" style={{ fontSize: 13, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
          You're in <strong>Demo Mode</strong> — accounts are saved in this browser only. Create two accounts to play both partners on one device. Add Supabase keys to enable real two-device sync.
        </p>
      )}

      <style>{`
        .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: var(--ground-2); padding: 5px; border-radius: 999px; margin-bottom: 18px; }
        .cfg-warn { display: flex; flex-direction: column; gap: 3px; background: #FCEEE7; border: 1px solid #F2C4AE; color: #8A3B1E; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.45; }
        .cfg-warn strong { font-size: 13px; }
        .cfg-sub { opacity: .8; font-size: 12px; margin-top: 2px; }
        .cfg-note { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-soft); margin-bottom: 16px; }
        .cfg-note.ok { color: #1E7A54; }
        .cfg-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cfg-dot.good { background: #22A06B; }
        .cfg-dot.checking { background: var(--gold-deep); animation: pulse 1s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
        .seg button { height: 42px; border-radius: 999px; font-weight: 700; font-size: 14px; color: var(--ink-soft); }
        .seg button[data-on="true"] { background: var(--white); color: var(--ink); box-shadow: var(--shadow-soft); }
        .pw-wrap { position: relative; }
        .pw-wrap input { width: 100%; padding-right: 52px; box-sizing: border-box; }
        .pw-toggle { position: absolute; right: 7px; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--line); background: var(--ground-2); color: var(--ink-soft); cursor: pointer; }
        .pw-toggle:hover { background: var(--white); color: var(--ink); }
        .pw-toggle[aria-pressed="true"] { color: var(--coral-deep); border-color: var(--coral); }
      `}</style>
    </div>
  );
}
