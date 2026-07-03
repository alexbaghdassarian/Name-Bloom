import { useEffect, useRef, useState } from "react";

// Speak a name aloud via the browser's speech synthesis (tap-to-hear).
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

const GENDER = {
  boy: { glyph: "♂", label: "Boy", color: "#5D8BD8" },
  girl: { glyph: "♀", label: "Girl", color: "#E06BA0" },
  unisex: { glyph: "⚥", label: "Either", color: "#2CA6A0" },
};

const SWIPE_X = 110; // px threshold to commit a horizontal decision
const SWIPE_UP = 130; // px threshold for a super like (swipe up)

export default function SwipeCard({
  name,
  surnamePreview,
  partnerLiked = false,
  interactive = false,
  depth = 0,
  fling = null, // { dir: 'like'|'nope'|'super', id } — set by parent buttons
  onDecision,
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(null); // 'like' | 'nope' | 'super'
  const startRef = useRef(null);
  const g = GENDER[name.gender] || GENDER.unisex;

  useEffect(() => {
    if (interactive && fling && fling.dir) commit(fling.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fling?.id]);

  const onPointerDown = (e) => {
    if (!interactive) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag((d) => ({ ...d, active: true }));
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!interactive || !startRef.current) return;
    setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y, active: true });
  };
  const commit = (dir) => {
    setLeaving(dir);
    setTimeout(() => {
      if (dir === "like") onDecision(true, false);
      else if (dir === "super") onDecision(true, true);
      else onDecision(false, false);
    }, 220);
  };
  const onPointerUp = () => {
    if (!interactive || !startRef.current) return;
    startRef.current = null;
    const { x, y } = drag;
    if (y < -SWIPE_UP && Math.abs(x) < SWIPE_X * 1.2) return commit("super");
    if (x > SWIPE_X) return commit("like");
    if (x < -SWIPE_X) return commit("nope");
    setDrag({ x: 0, y: 0, active: false });
  };

  // Visual transform
  let tx = drag.x, ty = drag.y, rot = drag.x / 18;
  if (leaving === "like") { tx = window.innerWidth; rot = 22; }
  if (leaving === "nope") { tx = -window.innerWidth; rot = -22; }
  if (leaving === "super") { ty = -window.innerHeight; rot = 0; }

  const likeOpacity = Math.min(1, Math.max(0, drag.x / SWIPE_X));
  const nopeOpacity = Math.min(1, Math.max(0, -drag.x / SWIPE_X));
  const superOpacity = Math.min(1, Math.max(0, -drag.y / SWIPE_UP)) * (Math.abs(drag.x) < 80 ? 1 : 0);

  const stackScale = 1 - depth * 0.04;
  const stackY = depth * 12;

  return (
    <div
      className="swipe-card"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform: `translate(${tx}px, ${ty + (interactive ? 0 : stackY)}px) rotate(${rot}deg) scale(${interactive ? 1 : stackScale})`,
        transition: drag.active ? "none" : "transform .32s cubic-bezier(.2,.7,.2,1)",
        zIndex: 30 - depth,
        touchAction: "none",
        cursor: interactive ? "grab" : "default",
      }}
      aria-hidden={!interactive}
    >
      {partnerLiked && (
        <div className="partner-flag">★ Your partner loved this</div>
      )}

      <div className="card-top">
        <span className="gender-pill" style={{ color: g.color }}>
          <span aria-hidden>{g.glyph}</span> {g.label}
        </span>
        <span className="origin-pill">{name.origin}</span>
      </div>

      <div className="card-name-wrap">
        <div className="card-name-row">
          <div className="display card-name">{name.name}</div>
          <button className="card-speak" onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); speakName(name.name); }} aria-label={`Hear ${name.name}`}>🔊</button>
        </div>
        {name.pronounce && <div className="card-pron">{name.pronounce}</div>}
        {surnamePreview && <div className="card-surname">{name.name} {surnamePreview}</div>}
        {name.alts && <div className="card-alts">also spelled {name.alts}</div>}
      </div>

      <div className="card-meaning">
        {name.meaning ? (
          <>
            <span className="eyebrow">Meaning</span>
            <p>{name.meaning}</p>
          </>
        ) : (
          <p className="muted">A {name.origin} name.</p>
        )}
      </div>

      {/* live decision overlays */}
      <div className="stamp stamp-like" style={{ opacity: leaving === "like" ? 1 : likeOpacity }}>Love it</div>
      <div className="stamp stamp-nope" style={{ opacity: leaving === "nope" ? 1 : nopeOpacity }}>Pass</div>
      <div className="stamp stamp-super" style={{ opacity: leaving === "super" ? 1 : superOpacity }}>Top pick ★</div>

      <style>{cardCSS}</style>
    </div>
  );
}

const cardCSS = `
.swipe-card {
  position: absolute; inset: 0;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 22px;
  display: flex; flex-direction: column;
  user-select: none;
  overflow: hidden;
}
.swipe-card::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 40%;
  background: radial-gradient(120% 100% at 50% 130%, rgba(244,183,64,0.16), rgba(244,183,64,0) 70%);
  pointer-events: none;
}
.card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.gender-pill, .origin-pill {
  font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
  padding: 6px 11px; border-radius: 999px; background: var(--ground-2);
}
.origin-pill { color: var(--ink-soft); }
.card-name-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 6px; }
.card-name-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
.card-name { font-weight: 600; font-size: clamp(48px, 15vw, 76px); color: var(--ink); }
.card-speak { border: 1px solid var(--line); background: var(--white); width: 40px; height: 40px; border-radius: 50%; font-size: 17px; cursor: pointer; flex-shrink: 0; box-shadow: var(--shadow-soft); }
.card-speak:active { transform: scale(.92); }
.card-pron { font-size: 15px; font-weight: 700; color: var(--teal); letter-spacing: .02em; }
.card-surname { font-family: var(--display); font-size: 20px; color: var(--ink-soft); opacity: .8; }
.card-alts { font-size: 12.5px; color: var(--ink-soft); font-style: italic; }
.card-meaning { text-align: center; padding: 4px 6px 6px; min-height: 62px; }
.card-meaning .eyebrow { display: block; margin-bottom: 4px; }
.card-meaning p { font-size: 16px; line-height: 1.4; color: var(--ink); }
.partner-flag {
  position: absolute; top: 0; left: 0; right: 0;
  background: linear-gradient(180deg, var(--gold), var(--gold-deep));
  color: #4a2c00; font-weight: 800; font-size: 12px; letter-spacing: .02em;
  text-align: center; padding: 6px; z-index: 5;
}
.stamp {
  position: absolute; top: 74px; padding: 6px 14px; border-radius: 12px;
  font-weight: 800; font-size: 26px; letter-spacing: .04em; text-transform: uppercase;
  border: 3px solid; transform: rotate(-12deg); pointer-events: none; transition: opacity .1s ease;
}
.stamp-like { left: 22px; color: var(--coral-deep); border-color: var(--coral-deep); }
.stamp-nope { right: 22px; color: var(--slate-deep); border-color: var(--slate-deep); transform: rotate(12deg); }
.stamp-super { left: 50%; top: 40%; transform: translateX(-50%) rotate(-4deg); color: var(--gold-deep); border-color: var(--gold-deep); }
`;
