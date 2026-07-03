import { useEffect, useMemo, useState } from "react";
import { store } from "../lib/api.js";
import { cultureList } from "../lib/names.js";

export default function ProjectSetup({ data, projectId, onCreated, onCancel }) {
  const cultures = useMemo(() => cultureList(data), [data]);
  const editing = Boolean(projectId);

  const [name, setName] = useState("My first baby");
  const [surname, setSurname] = useState("");
  const [gender, setGender] = useState("all");
  const [included, setIncluded] = useState(() => new Set());
  const [favorites, setFavorites] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    store.getProject(projectId).then((p) => {
      if (!p) return;
      setName(p.name);
      setSurname(p.surname || "");
      setGender(p.genderFilter || "all");
      setIncluded(new Set(p.includedCultures || []));
      setFavorites(new Set(p.favoriteCultures || []));
    });
  }, [projectId, editing]);

  const toggleInclude = (key) => {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setFavorites((f) => { const g = new Set(f); g.delete(key); return g; });
      } else next.add(key);
      return next;
    });
  };
  const toggleFav = (key, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else { next.add(key); setIncluded((i) => new Set(i).add(key)); }
      return next;
    });
  };
  const selectAll = () => setIncluded(new Set(cultures.map((c) => c.key)));
  const clearAll = () => { setIncluded(new Set()); setFavorites(new Set()); };

  const poolCount = data.names.filter(
    (n) => included.has(n.culture) && (gender === "all" || n.gender === gender || n.gender === "unisex")
  ).length;

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        name: name.trim() || "Our baby",
        surname: surname.trim(),
        genderFilter: gender,
        includedCultures: [...included],
        favoriteCultures: [...favorites],
      };
      if (editing) {
        await store.updateProject(projectId, payload);
        onCreated(projectId);
      } else {
        const p = await store.createProject(payload);
        onCreated(p.id);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rise setup" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ padding: "8px 4px 6px" }}>
        <p className="eyebrow">{editing ? "Project settings" : "New project"}</p>
        <h2 className="display" style={{ fontSize: 28, fontWeight: 600, margin: "4px 0 0" }}>
          {editing ? "Adjust your name pool" : "Set the stage"}
        </h2>
      </div>

      <div className="setup-scroll">
        <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
          <label className="field" style={{ marginBottom: 12 }}>
            <span>Project name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My first baby" />
          </label>
          <label className="field" style={{ marginBottom: 12 }}>
            <span>Last name (optional — previews the full name)</span>
            <input value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="e.g. Rivera" />
          </label>
          <span className="field-label">Looking for</span>
          <div className="gender-row">
            {[["all", "Surprise us"], ["boy", "Boy"], ["girl", "Girl"], ["unisex", "Unisex"]].map(([v, l]) => (
              <button key={v} className="chip" data-state={gender === v ? "in" : ""} onClick={() => setGender(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "2px 4px 10px" }}>
          <div>
            <p className="eyebrow">Cultures</p>
            <p className="muted" style={{ fontSize: 13 }}>Tap to include · ★ to prioritize favorites</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="chip btn-sm" onClick={selectAll}>All</button>
            <button className="chip btn-sm" onClick={clearAll}>Clear</button>
          </div>
        </div>

        <div className="culture-grid">
          {cultures.map((c) => {
            const state = favorites.has(c.key) ? "fav" : included.has(c.key) ? "in" : "out";
            return (
              <button key={c.key} className="culture-card" data-state={state} onClick={() => toggleInclude(c.key)}>
                <div className="cc-top">
                  <span className="cc-glyph">{c.glyph}</span>
                  <span className="cc-label">{c.label}</span>
                  <span
                    className="cc-star"
                    role="button"
                    tabIndex={0}
                    aria-label={`Favorite ${c.label}`}
                    data-on={favorites.has(c.key)}
                    onClick={(e) => toggleFav(c.key, e)}
                    onKeyDown={(e) => e.key === "Enter" && toggleFav(c.key, e)}
                  >★</span>
                </div>
                <div className="cc-examples">{c.examples.join(" · ")}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="setup-foot">
        <p className="muted" style={{ fontSize: 13, textAlign: "center", marginBottom: 8 }}>
          {included.size === 0 ? "Pick at least one culture to begin" : `${poolCount} names in your pool`}
          {favorites.size > 0 && included.size > 0 && ` · ${favorites.size} favorited`}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: "0 0 40%" }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-coral" disabled={busy || included.size === 0} onClick={save}>
            {busy ? "Saving…" : editing ? "Save changes" : "Start swiping"}
          </button>
        </div>
      </div>

      <style>{`
        .setup-scroll { flex: 1; overflow-y: auto; padding: 2px; -webkit-overflow-scrolling: touch; }
        .field-label { display: block; font-size: 13px; font-weight: 600; color: var(--ink-soft); margin: 2px 0 8px 4px; }
        .gender-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .culture-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-bottom: 8px; }
        .culture-card {
          text-align: left; padding: 12px; border-radius: 18px; border: 1.5px solid var(--line);
          background: var(--white); transition: all .12s ease;
        }
        .culture-card[data-state="in"] { border-color: var(--ink); box-shadow: var(--shadow-soft); }
        .culture-card[data-state="fav"] { border-color: var(--gold-deep); background: linear-gradient(180deg,#FFF6E4,#FFFDFB); box-shadow: 0 8px 20px -12px rgba(224,154,22,.5); }
        .culture-card[data-state="out"] { opacity: .62; }
        .cc-top { display: flex; align-items: center; gap: 6px; }
        .cc-glyph { font-size: 16px; }
        .cc-label { font-weight: 700; font-size: 14px; flex: 1; letter-spacing: -0.01em; }
        .cc-star { font-size: 16px; color: var(--line); padding: 2px; line-height: 1; }
        .cc-star[data-on="true"] { color: var(--gold-deep); }
        .cc-examples { font-size: 12px; color: var(--ink-soft); margin-top: 6px; line-height: 1.35; }
        .setup-foot { padding-top: 12px; }
      `}</style>
    </div>
  );
}
