import { useEffect, useRef, useState } from "react";
import SwipeCard from "./SwipeCard.jsx";

// Renders the stack and the three action controls. Owns only the visual index;
// persistence + match detection live in the parent via onSwipe.
export default function SwipeDeck({ deck, index, surname, partnerLikedIds, onSwipe }) {
  const [fling, setFling] = useState(null);
  const flingId = useRef(0);

  const top = deck[index];
  const upcoming = deck.slice(index, index + 3);

  const decide = (liked, superliked) => {
    if (!top) return;
    onSwipe(top, liked, superliked);
    setFling(null);
  };

  const button = (dir) => {
    if (!top) return;
    setFling({ dir, id: ++flingId.current });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") button("nope");
      else if (e.key === "ArrowRight") button("like");
      else if (e.key === "ArrowUp") button("super");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top]);

  return (
    <div className="deck-wrap">
      <div className="deck-stack">
        {upcoming.map((n, i) => (
          <SwipeCard
            key={n.id}
            name={n}
            depth={i}
            interactive={i === 0}
            surnamePreview={surname || null}
            partnerLiked={i === 0 && partnerLikedIds?.has(n.id)}
            fling={i === 0 ? fling : null}
            onDecision={(liked, superliked) => decide(liked, superliked)}
          />
        ))}
        {!top && (
          <div className="deck-empty panel">
            <div style={{ fontSize: 34 }}>🌸</div>
            <p className="display" style={{ fontSize: 24, margin: "8px 0 4px" }}>You've seen them all</p>
            <p className="muted">Open <strong>Matches</strong> to celebrate the names you both loved — or widen your cultures in Settings for a fresh batch.</p>
          </div>
        )}
      </div>

      <div className="deck-controls" role="group" aria-label="Rate this name">
        <button className="round round-nope" onClick={() => button("nope")} disabled={!top} aria-label="Pass">
          ✕
        </button>
        <button className="round round-super" onClick={() => button("super")} disabled={!top} aria-label="Top pick">
          ★
        </button>
        <button className="round round-like" onClick={() => button("like")} disabled={!top} aria-label="Love it">
          ♥
        </button>
      </div>
      <p className="deck-hint muted">Swipe or use ← pass · ↑ top pick · like →</p>

      <style>{deckCSS}</style>
    </div>
  );
}

const deckCSS = `
.deck-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.deck-stack { position: relative; flex: 1; min-height: 380px; margin: 6px 0 14px; }
.deck-empty {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; padding: 28px;
}
.deck-controls { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 2px 0 6px; }
.round {
  display: grid; place-items: center; border-radius: 999px; background: var(--white);
  border: 1px solid var(--line); box-shadow: var(--shadow-soft);
  transition: transform .12s ease, box-shadow .2s ease;
}
.round:active { transform: translateY(2px) scale(.96); }
.round:disabled { opacity: .4; }
.round-nope { width: 62px; height: 62px; font-size: 24px; color: var(--slate-deep); }
.round-super { width: 54px; height: 54px; font-size: 22px; color: var(--gold-deep); }
.round-like { width: 62px; height: 62px; font-size: 26px; color: var(--coral-deep); }
.round-like:hover { box-shadow: 0 10px 22px -10px rgba(216,68,95,.5); }
.round-super:hover { box-shadow: 0 10px 22px -10px rgba(224,154,22,.5); }
.deck-hint { text-align: center; font-size: 12px; margin-top: 8px; }
`;
