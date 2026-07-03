import { useEffect, useMemo, useRef, useState } from "react";
import { store, computeMatches, partnerLikedIds } from "../lib/api.js";
import { buildDeck, nameById } from "../lib/names.js";
import SwipeDeck from "../components/SwipeDeck.jsx";
import Confetti from "../components/Confetti.jsx";

export default function Swiping({ data, user, projectId, onMatches, onSettings }) {
  const [project, setProject] = useState(null);
  const [memberIds, setMemberIds] = useState([]);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [swipes, setSwipes] = useState([]);
  const [confetti, setConfetti] = useState({ id: 0, big: false });
  const [toast, setToast] = useState(null);

  const matchedIds = useRef(new Set());
  const target = project?.targetMatches || 100;

  // Initial load: project + members + my swiped ids -> build deck once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await store.getProject(projectId);
      const members = await store.projectMembers(projectId);
      const mine = await store.mySwipedIds(projectId);
      const all = await store.allSwipes(projectId);
      if (cancelled) return;
      setProject(p);
      const ids = members.map((m) => m.id);
      setMemberIds(ids);
      setDeck(buildDeck(data, p, mine));
      setIndex(0);
      setSwipes(all);
      matchedIds.current = new Set(computeMatches(all, ids).map((m) => m.nameId));
    })();
    return () => { cancelled = true; };
  }, [projectId, data]);

  // Realtime: partner activity -> refresh swipes, celebrate new matches
  useEffect(() => {
    if (!projectId) return;
    const off = store.subscribeProject(projectId, () => refreshSwipes(false));
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, memberIds.join()]);

  const refreshSwipes = async (mineJustNow) => {
    const all = await store.allSwipes(projectId);
    setSwipes(all);
    const nowMatches = computeMatches(all, memberIds);
    const nowSet = new Set(nowMatches.map((m) => m.nameId));
    const added = [...nowSet].filter((id) => !matchedIds.current.has(id));
    const prevCount = matchedIds.current.size;
    matchedIds.current = nowSet;

    if (added.length > 0 && memberIds.length >= 2) {
      const crossed = prevCount < target && nowSet.size >= target;
      setConfetti({ id: Date.now(), big: crossed });
      const nm = nameById(data, added[0]);
      setToast(crossed
        ? { title: `${nowSet.size} matches! 🎉`, sub: "You've hit your goal — go celebrate together." }
        : { title: `It's a match: ${nm?.name || "a name"}!`, sub: mineJustNow ? "You both love this one." : `${partnerName()} just loved one you liked.` });
      clearTimeout(refreshSwipes._t);
      refreshSwipes._t = setTimeout(() => setToast(null), 3200);
    }
  };

  const partnerName = () => "Your partner";

  const onSwipe = async (name, liked, superliked) => {
    setIndex((i) => i + 1);
    await store.addSwipe(projectId, name.id, liked, superliked);
    await refreshSwipes(true);
  };

  const myLikes = useMemo(() => swipes.filter((s) => s.userId === user.id).length, [swipes, user.id]);
  const pLiked = useMemo(() => partnerLikedIds(swipes, user.id), [swipes, user.id]);
  const matchCount = matchedIds.current.size;
  const pct = Math.min(100, Math.round((matchCount / target) * 100));

  if (!project) return <div style={{ flex: 1, display: "grid", placeItems: "center" }} className="muted">Loading project…</div>;

  return (
    <div className="swipe-screen">
      <Confetti trigger={confetti.id} big={confetti.big} />

      <div className="swipe-aside">
        <div className="swipe-head">
          <div>
            <p className="eyebrow">{project.name}</p>
            <p className="muted" style={{ fontSize: 13 }}>{myLikes} reviewed by you</p>
          </div>
          <button className="chip btn-sm" onClick={onSettings}>Settings</button>
        </div>

        <button className="progress" onClick={onMatches} aria-label="Open matches">
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <div className="progress-meta">
            <span><strong>{matchCount}</strong> / {target} matches</span>
            <span className="progress-open">View matches →</span>
          </div>
        </button>

        <div className="swipe-tips panel">
          <p className="eyebrow" style={{ marginBottom: 8 }}>How to swipe</p>
          <p><span>♥</span> Drag right or press <kbd>→</kbd> to love it</p>
          <p><span>✕</span> Drag left or press <kbd>←</kbd> to pass</p>
          <p><span className="tip-gold">★</span> Swipe up or press <kbd>↑</kbd> for a top pick</p>
          <p className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>When you both love the same name, it blooms into a match.</p>
        </div>
      </div>

      <div className="swipe-main">
        <SwipeDeck
          deck={deck}
          index={index}
          surname={project.surname}
          partnerLikedIds={pLiked}
          onSwipe={onSwipe}
        />
      </div>

      {toast && (
        <div className="toast rise" role="status">
          <strong>{toast.title}</strong>
          <span>{toast.sub}</span>
        </div>
      )}

      <style>{`
        .swipe-screen { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .swipe-main { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .swipe-aside { display: flex; flex-direction: column; }
        .swipe-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .progress { display: block; width: 100%; text-align: left; margin-bottom: 8px; }
        .progress-track { height: 10px; background: var(--ground-2); border-radius: 999px; overflow: hidden; border: 1px solid var(--line); }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--coral), var(--gold)); border-radius: 999px; transition: width .5s cubic-bezier(.2,.7,.2,1); }
        .progress-meta { display: flex; justify-content: space-between; margin-top: 6px; font-size: 13px; color: var(--ink-soft); }
        .progress-meta strong { color: var(--ink); font-family: var(--display); }
        .progress-open { color: var(--coral-deep); font-weight: 700; }
        /* tips panel is desktop-only context for the sidebar */
        .swipe-tips { display: none; padding: 16px; margin-top: 4px; }
        .swipe-tips p { font-size: 13.5px; color: var(--ink); margin: 6px 0; display: flex; align-items: center; gap: 8px; }
        .swipe-tips p > span:first-child { color: var(--coral-deep); font-weight: 800; width: 16px; text-align: center; }
        .swipe-tips .tip-gold { color: var(--gold-deep); }
        .swipe-tips kbd { background: var(--ground-2); border: 1px solid var(--line); border-radius: 6px; padding: 1px 6px; font-size: 12px; font-family: inherit; }
        .toast {
          position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(22px + env(safe-area-inset-bottom));
          background: var(--ink); color: var(--white); padding: 12px 18px; border-radius: 16px; z-index: 70;
          display: flex; flex-direction: column; gap: 2px; box-shadow: var(--shadow-card); max-width: 92vw; text-align: center;
        }
        .toast strong { font-size: 15px; }
        .toast span { font-size: 13px; opacity: .85; }

        /* ---- desktop: two-pane layout (deck left, context right) ---- */
        @media (min-width: 980px) {
          .swipe-screen { flex-direction: row; gap: 40px; align-items: stretch; }
          .swipe-main { order: 1; }
          .swipe-aside { order: 2; width: 300px; flex-shrink: 0; justify-content: flex-start; }
          .swipe-tips { display: block; }
          .deck-stack { min-height: 520px !important; }
          .deck-hint { display: none; }
        }
      `}</style>
    </div>
  );
}
