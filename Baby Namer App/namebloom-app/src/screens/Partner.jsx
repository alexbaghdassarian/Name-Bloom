import { useEffect, useState } from "react";
import { store } from "../lib/api.js";

export default function Partner({ user, onDone }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    store.getPartner().then(setPartner);
  }, []);

  const link = async () => {
    setErr("");
    if (email.trim().toLowerCase() === user.email.toLowerCase()) {
      setErr("That's your own email — enter your partner's.");
      return;
    }
    setBusy(true);
    try {
      const found = await store.findByEmail(email.trim());
      if (!found) {
        setErr("No account with that email yet. Ask your partner to create one first, then link.");
        return;
      }
      const p = await store.setPartner(found.id, found.email);
      setPartner(p);
    } catch (e) {
      setErr(e.message || "Could not link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rise" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ padding: "10px 4px 18px" }}>
        <p className="eyebrow">Step 1 — your other half</p>
        <h2 className="display" style={{ fontSize: 30, fontWeight: 600, margin: "6px 0 8px" }}>Who are you naming with?</h2>
        <p className="muted" style={{ lineHeight: 1.5 }}>Link your partner's account so your projects and matches stay in sync between you.</p>
      </div>

      {partner ? (
        <div className="panel" style={{ padding: 22, textAlign: "center" }}>
          <div style={{ fontSize: 30 }}>💞</div>
          <p className="display" style={{ fontSize: 24, margin: "8px 0 2px" }}>{user.name} &amp; {partner.name}</p>
          <p className="muted" style={{ marginBottom: 18 }}>You're linked. Time to start a name project together.</p>
          <button className="btn btn-primary" onClick={onDone}>Continue</button>
        </div>
      ) : (
        <div className="panel" style={{ padding: 20 }}>
          <label className="field">
            <span>Partner's email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="partner@email.com" />
          </label>
          {err && <p style={{ color: "var(--coral-deep)", fontSize: 14, margin: "0 4px 12px", fontWeight: 600 }}>{err}</p>}
          <button className="btn btn-coral" disabled={busy || !email} onClick={link}>
            {busy ? "Linking…" : "Link partner"}
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onDone}>Skip for now</button>
        </div>
      )}
    </div>
  );
}
