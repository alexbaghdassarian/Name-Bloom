import { useEffect, useState } from "react";
import { store, computeMatches } from "../lib/api.js";

export default function Projects({ user, onOpen, onNew, onNeedPartner }) {
  const [projects, setProjects] = useState(null);
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    (async () => {
      const [ps, pr] = await Promise.all([store.listProjects(), store.getPartner()]);
      setProjects(ps);
      setPartner(pr);
      const s = {};
      for (const p of ps) {
        const [swipes, members] = await Promise.all([store.allSwipes(p.id), store.projectMembers(p.id)]);
        s[p.id] = computeMatches(swipes, members.map((m) => m.id)).length;
      }
      setStats(s);
    })();
  }, [user]);

  return (
    <div className="rise" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ padding: "10px 4px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p className="eyebrow">Your projects</p>
          <h2 className="display" style={{ fontSize: 30, fontWeight: 600, margin: "4px 0 0" }}>Name journeys</h2>
        </div>
      </div>

      {!partner && (
        <button className="panel partner-nudge" onClick={onNeedPartner}>
          <span style={{ fontSize: 22 }}>🔗</span>
          <span>
            <strong>Link your partner</strong>
            <em>Sync projects and matches between you.</em>
          </span>
          <span style={{ marginLeft: "auto", color: "var(--coral-deep)", fontWeight: 700 }}>Link →</span>
        </button>
      )}
      {partner && (
        <p className="muted" style={{ fontSize: 13, margin: "0 4px 12px" }}>Naming with <strong style={{ color: "var(--ink)" }}>{partner.name}</strong> 💞</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {projects && projects.length === 0 && (
          <div className="panel" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>🌱</div>
            <p className="display" style={{ fontSize: 22, margin: "8px 0 4px" }}>No projects yet</p>
            <p className="muted">Start with something like “My first baby.”</p>
          </div>
        )}
        {projects?.map((p) => (
          <button key={p.id} className="panel project-card" onClick={() => onOpen(p.id)}>
            <div>
              <p className="display" style={{ fontSize: 22, fontWeight: 600 }}>{p.name}</p>
              <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {(p.includedCultures || []).length} cultures · {p.genderFilter === "all" ? "any gender" : p.genderFilter}
              </p>
            </div>
            <div className="match-badge">
              <span className="n">{stats[p.id] ?? "·"}</span>
              <span className="l">matches</span>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 18 }}>
        <button className="btn btn-coral" onClick={onNew}>+ New name project</button>
      </div>

      <style>{`
        .partner-nudge { display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin-bottom: 14px; text-align: left; width: 100%; }
        .partner-nudge span em { display: block; font-style: normal; font-size: 13px; color: var(--ink-soft); }
        .project-card { display: flex; align-items: center; justify-content: space-between; padding: 18px; text-align: left; width: 100%; }
        .project-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-card); }
        .match-badge { display: flex; flex-direction: column; align-items: center; background: linear-gradient(180deg,var(--gold),var(--gold-deep)); color: #4a2c00; border-radius: 16px; padding: 8px 14px; min-width: 68px; }
        .match-badge .n { font-family: var(--display); font-size: 24px; font-weight: 700; line-height: 1; }
        .match-badge .l { font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
      `}</style>
    </div>
  );
}
