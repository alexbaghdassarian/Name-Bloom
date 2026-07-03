import { useEffect, useMemo, useState } from "react";
import { store, computeMatches } from "../lib/api.js";
import { nameById } from "../lib/names.js";
import Confetti from "../components/Confetti.jsx";

function speakName(name) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(name);
    u.rate = 0.9;
    synth.speak(u);
  } catch { /* not supported */ }
}

export default function Matches({ data, user, projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [memberIds, setMemberIds] = useState([]);
  const [swipes, setSwipes] = useState([]);
  const [finalists, setFinalists] = useState([]);
  const [vetoes, setVetoes] = useState([]);
  const [confetti, setConfetti] = useState(0);
  const [tab, setTab] = useState("all"); // all | finalists

  const refresh = async () => {
    const [p, members, all, fin, vet] = await Promise.all([
      store.getProject(projectId),
      store.projectMembers(projectId),
      store.allSwipes(projectId),
      store.listFinalists(projectId),
      store.listVetoes(projectId),
    ]);
    setProject(p);
    setMemberIds(members.map((m) => m.id));
    setSwipes(all);
    setFinalists(fin);
    setVetoes(vet);
  };

  useEffect(() => { refresh(); }, [projectId]);
  useEffect(() => {
    const off = store.subscribeProject(projectId, refresh);
    return off;
  }, [projectId]);

  const vetoedIds = useMemo(() => new Set(vetoes.map((v) => v.nameId)), [vetoes]);

  const matches = useMemo(() => {
    const raw = computeMatches(swipes, memberIds).filter((m) => !vetoedIds.has(m.nameId));
    const favs = new Set(project?.favoriteCultures || []);
    return raw
      .map((m) => ({ ...m, name: nameById(data, m.nameId) }))
      .filter((m) => m.name)
      .sort((a, b) => {
        if (a.superMatch !== b.superMatch) return a.superMatch ? -1 : 1;
        const af = favs.has(a.name.culture), bf = favs.has(b.name.culture);
        if (af !== bf) return af ? -1 : 1;
        return a.name.name.localeCompare(b.name.name);
      });
  }, [swipes, memberIds, vetoedIds, project, data]);

  // Every name *I* liked or gave a top pick — independent of my partner.
  const myLikes = useMemo(() => {
    const seen = new Map();
    for (const s of swipes) {
      if (s.userId !== user.id || !s.liked) continue;
      const prev = seen.get(s.nameId);
      seen.set(s.nameId, { nameId: s.nameId, superMatch: (prev?.superMatch || s.superliked) });
    }
    return [...seen.values()]
      .map((m) => ({ ...m, name: nameById(data, m.nameId) }))
      .filter((m) => m.name)
      .sort((a, b) => {
        if (a.superMatch !== b.superMatch) return a.superMatch ? -1 : 1;
        return a.name.name.localeCompare(b.name.name);
      });
  }, [swipes, user.id, data]);

  // A "mutual finalist" = both members starred it.
  const finalistCount = useMemo(() => {
    const byName = {};
    finalists.forEach((f) => { (byName[f.nameId] ||= new Set()).add(f.userId); });
    return byName;
  }, [finalists]);

  const isMutualFinalist = (id) => memberIds.length > 0 && memberIds.every((m) => finalistCount[id]?.has(m));
  const iNominated = (id) => finalists.some((f) => f.nameId === id && f.userId === user.id);

  useEffect(() => {
    if (matches.length > 0) setConfetti(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.length > 0]);

  const isMine = tab === "mine";
  const shown = isMine
    ? myLikes
    : tab === "finalists"
      ? matches.filter((m) => isMutualFinalist(m.nameId) || iNominated(m.nameId))
      : matches;

  const share = async () => {
    const list = matches.filter((m) => isMutualFinalist(m.nameId));
    const pool = list.length ? list : matches;
    const text = `Our name shortlist 🌸\n\n` +
      pool.map((m) => `• ${m.name.name}${project.surname ? " " + project.surname : ""} — ${m.name.meaning || m.name.origin}`).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "Our baby name shortlist", text });
      else { await navigator.clipboard.writeText(text); alert("Shortlist copied to clipboard!"); }
    } catch { /* user dismissed */ }
  };

  if (!project) return <div style={{ flex: 1, display: "grid", placeItems: "center" }} className="muted">Loading…</div>;

  const celebratory = matches.length >= (project.targetMatches || 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Confetti trigger={confetti} big={celebratory} />

      <div className="matches-head">
        <button className="chip btn-sm" onClick={onBack}>← Swipe</button>
        <button className="chip btn-sm" onClick={share} disabled={matches.length === 0}>Share ⇪</button>
      </div>

      <div style={{ textAlign: "center", padding: "6px 0 14px" }}>
        <div style={{ fontSize: 30 }}>{isMine ? "💗" : celebratory ? "🎉" : "🌸"}</div>
        <h2 className="display" style={{ fontSize: 30, fontWeight: 600, margin: "4px 0 2px" }}>
          {isMine
            ? `${myLikes.length} name${myLikes.length === 1 ? "" : "s"} you like`
            : `${matches.length} name${matches.length === 1 ? "" : "s"} ${memberIds.length >= 2 ? "you both love" : "you loved"}`}
        </h2>
        <p className="muted" style={{ fontSize: 14 }}>
          {isMine
            ? (myLikes.length === 0 ? "Swipe right on names you like — they'll collect here, just for you." : "Everything you liked or gave a top pick. Only you see this list.")
            : (matches.length === 0 ? "Keep swiping — your first match will appear here." : "Star your favorites. When you both star the same name, it becomes a finalist.")}
        </p>
      </div>

      {(myLikes.length > 0 || matches.length > 0) && (
        <div className="seg2 seg3">
          <button data-on={tab === "mine"} onClick={() => setTab("mine")}>My likes</button>
          <button data-on={tab === "all"} onClick={() => setTab("all")}>Matches</button>
          <button data-on={tab === "finalists"} onClick={() => setTab("finalists")}>Finalists</button>
        </div>
      )}

      <div className="match-list">
        {shown.length === 0 && tab === "finalists" && (
          <p className="muted" style={{ textAlign: "center", padding: 20 }}>No finalists yet. Star names you'd truly consider.</p>
        )}
        {shown.length === 0 && isMine && (
          <p className="muted" style={{ textAlign: "center", padding: 20 }}>You haven't liked any names yet. Head back and start swiping!</p>
        )}
        {(() => {
          const superList = shown.filter((m) => m.superMatch);
          const restList = shown.filter((m) => !m.superMatch);
          const renderRow = (m) => {
            const mutual = isMutualFinalist(m.nameId);
            const mine = iNominated(m.nameId);
            return (
              <div key={m.nameId} className="match-item" data-final={mutual} data-super={m.superMatch}>
                <div className="mi-main">
                  <div className="mi-name display">
                    {m.name.name}{project.surname ? <span className="mi-surname"> {project.surname}</span> : null}
                    {m.superMatch && <span className="mi-super" title="Super match">★</span>}
                    {mutual && <span className="mi-final">Finalist</span>}
                    <button className="mi-speak" onClick={() => speakName(m.name.name)} aria-label={`Hear ${m.name.name}`}>🔊</button>
                  </div>
                  <div className="mi-meta">{m.name.pronounce ? `${m.name.pronounce} · ` : ""}{m.name.origin}{m.name.meaning ? ` · ${m.name.meaning}` : ""}</div>
                  {m.name.alts ? <div className="mi-alts">also spelled {m.name.alts}</div> : null}
                </div>
                <div className="mi-actions">
                  <button className={`mi-btn ${mine ? "on" : ""}`} aria-label="Nominate finalist" onClick={() => store.toggleFinalist(projectId, m.nameId)}>★</button>
                  {!isMine && (
                    <button className="mi-btn veto" aria-label="Remove name" onClick={() => { if (confirm(`Remove ${m.name.name} from your matches?`)) store.toggleVeto(projectId, m.nameId); }}>✕</button>
                  )}
                </div>
              </div>
            );
          };
          return (
            <>
              {superList.length > 0 && (
                <>
                  <div className="match-section-head">★ Top picks<span className="mshead-note">super-liked</span></div>
                  {superList.map(renderRow)}
                </>
              )}
              {restList.length > 0 && (
                <>
                  {superList.length > 0 && <div className="match-section-head">{isMine ? "More names you liked" : "More matches"}</div>}
                  {restList.map(renderRow)}
                </>
              )}
            </>
          );
        })()}
      </div>

      <style>{`
        .matches-head { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .seg2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: var(--ground-2); padding: 5px; border-radius: 999px; margin-bottom: 12px; }
        .seg3 { grid-template-columns: 1fr 1fr 1fr; }
        .seg2 button { height: 38px; border-radius: 999px; font-weight: 700; font-size: 13px; color: var(--ink-soft); }
        .seg2 button[data-on="true"] { background: var(--white); color: var(--ink); box-shadow: var(--shadow-soft); }
        .match-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 2px 2px 8px; }
        .match-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; background: var(--white); border: 1px solid var(--line); border-radius: 18px; }
        .match-item[data-final="true"] { border-color: var(--gold-deep); background: linear-gradient(180deg,#FFF7E6,#FFFDFB); }
        .mi-main { min-width: 0; }
        .mi-name { font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .mi-surname { color: var(--ink-soft); font-size: 18px; }
        .mi-super { color: var(--gold-deep); font-size: 16px; }
        .match-section-head { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); margin: 16px 2px 8px; display: flex; align-items: center; gap: 8px; }
        .match-section-head:first-child { margin-top: 2px; }
        .mshead-note { font-weight: 600; letter-spacing: .02em; text-transform: none; color: var(--gold-deep); font-size: 11px; }
        .match-item[data-super="true"] { border-color: var(--gold); background: linear-gradient(180deg, #FFF9EC, var(--white)); }
        .mi-final { font-family: var(--sans); font-size: 10px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; background: var(--gold-deep); color: #fff; padding: 3px 7px; border-radius: 999px; }
        .mi-meta { font-size: 13px; color: var(--ink-soft); margin-top: 2px; }
        .mi-alts { font-size: 11.5px; color: var(--ink-soft); font-style: italic; margin-top: 2px; }
        .mi-speak { border: 0; background: transparent; font-size: 14px; cursor: pointer; padding: 2px 4px; opacity: .75; }
        .mi-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .mi-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--line); background: var(--ground); font-size: 17px; color: var(--ink-soft); }
        .mi-btn.on { background: linear-gradient(180deg,var(--gold),var(--gold-deep)); color: #4a2c00; border-color: transparent; }
        .mi-btn.veto:hover { color: var(--coral-deep); border-color: var(--coral); }
      `}</style>
    </div>
  );
}
