import { useEffect, useState } from "react";
import { demoStore } from "../lib/demoStore.js";

// Floating helper visible only in Demo Mode. Lets one person act as either
// partner on a single device so the whole matching flow can be tried out.
export default function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);

  const sync = () => {
    setUsers(demoStore.listUsers());
    setMe(demoStore.currentUser());
  };
  useEffect(() => {
    sync();
    return demoStore.onChange(sync);
  }, []);

  return (
    <>
      <button className="demo-fab" onClick={() => setOpen((o) => !o)} aria-label="Switch demo partner">
        ⇄ {me?.name?.split(" ")[0] || "You"}
      </button>

      {open && (
        <div className="demo-sheet rise">
          <p className="eyebrow" style={{ marginBottom: 8 }}>Demo — acting as</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {users.map((u) => (
              <button
                key={u.id}
                className="chip"
                data-state={u.id === me?.id ? "in" : ""}
                style={{ justifyContent: "space-between", width: "100%" }}
                onClick={() => { demoStore.switchTo(u.id); setOpen(false); }}
              >
                <span>{u.name}</span>
                <span style={{ fontSize: 11, opacity: .7 }}>{u.email}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => { demoStore.signOut(); setOpen(false); }}>
            Sign out to add another partner
          </button>
        </div>
      )}

      <style>{`
        .demo-fab {
          position: fixed; right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); z-index: 80;
          background: var(--ink); color: var(--white); padding: 10px 14px; border-radius: 999px;
          font-weight: 700; font-size: 13px; box-shadow: var(--shadow-card);
        }
        .demo-sheet {
          position: fixed; right: 14px; bottom: calc(60px + env(safe-area-inset-bottom)); z-index: 80;
          background: var(--white); border: 1px solid var(--line); border-radius: 18px; padding: 14px;
          width: min(300px, 88vw); box-shadow: var(--shadow-card);
        }
      `}</style>
    </>
  );
}
