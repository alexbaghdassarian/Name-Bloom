import { useEffect, useRef } from "react";

const COLORS = ["#F4B740", "#F0637E", "#2CA6A0", "#E09A16", "#D8445F", "#FBF3EC"];

// Fires a one-shot burst whenever `trigger` changes to a new truthy value.
// `big` scales the number of pieces up for milestone celebrations.
export default function Confetti({ trigger, big = false }) {
  const canvasRef = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    if (!trigger) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = (canvas.width = window.innerWidth * dpr);
    const h = (canvas.height = window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const count = big ? 220 : 90;
    const cx = w / 2;
    const cy = h * (big ? 0.4 : 0.42);
    const pieces = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = (big ? 9 : 7) * (0.4 + Math.random()) * dpr;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6 * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        size: (6 + Math.random() * 7) * dpr,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 0,
      };
    });

    const gravity = 0.28 * dpr;
    let running = true;
    const start = performance.now();

    const frame = (t) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const elapsed = t - start;
      for (const p of pieces) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rot += p.vr;
        p.life = elapsed;
        const alpha = Math.max(0, 1 - elapsed / (big ? 2600 : 1800));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (elapsed < (big ? 2600 : 1800)) raf.current = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf.current = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf.current);
      ctx.clearRect(0, 0, w, h);
    };
  }, [trigger, big]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }}
    />
  );
}
