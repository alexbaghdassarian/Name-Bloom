// Loads the names dataset and builds a swipe deck that respects a project's
// included / excluded cultures, favorite-culture prioritization, and gender filter.

let _cache = null;

export async function loadNames() {
  if (_cache) return _cache;
  const res = await fetch("/names.json");
  if (!res.ok) throw new Error("Could not load names.json");
  _cache = await res.json();
  return _cache;
}

// Emoji per region for a little visual identity during setup (not flags — cultures
// are broader than nations).
const REGION_GLYPH = {
  "Western Europe": "🌿",
  "Southern Europe": "🏛️",
  "Central Europe": "🍂",
  "Northern Europe": "❄️",
  "Eastern Europe": "🌾",
  "Caucasus": "🏔️",
  "Middle East": "🌙",
  "South Asia": "🪷",
  "East Asia": "🎐",
  "Africa": "🌍",
  "Pacific": "🌺",
  "Southeast Asia": "🌴",
  "Americas": "🗽",
};

export function cultureList(data) {
  return Object.entries(data.cultures).map(([key, c]) => {
    const examples = data.names
      .filter((n) => n.culture === key)
      .slice(0, 4)
      .map((n) => n.name);
    return { key, ...c, glyph: REGION_GLYPH[c.region] || "✨", examples };
  });
}

// Deterministic-ish shuffle seeded by project id so both partners can see names
// in a comparable order, while still feeling random.
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build the ordered deck for a project.
 * @param data          the loaded names.json
 * @param project       { includedCultures, favoriteCultures, genderFilter, seedId }
 * @param swipedIds     Set of name ids this user already swiped
 */
export function buildDeck(data, project, swipedIds = new Set()) {
  const included = new Set(project.includedCultures || []);
  const favorites = new Set(project.favoriteCultures || []);
  const gender = project.genderFilter || "all";

  let pool = data.names.filter((n) => {
    if (!included.has(n.culture)) return false;
    if (swipedIds.has(n.id)) return false;
    if (gender === "all") return true;
    if (gender === "unisex") return n.gender === "unisex";
    return n.gender === gender || n.gender === "unisex";
  });

  pool = seededShuffle(pool, project.seedId || "seed");

  // Split into favorite vs rest, then interleave so favorites dominate the front
  // of the deck (~2 favorites for every 1 other) while still mixing cultures.
  const fav = pool.filter((n) => favorites.has(n.culture));
  const rest = pool.filter((n) => !favorites.has(n.culture));

  if (fav.length === 0) return pool;

  const deck = [];
  let fi = 0;
  let ri = 0;
  while (fi < fav.length || ri < rest.length) {
    if (fi < fav.length) deck.push(fav[fi++]);
    if (fi < fav.length) deck.push(fav[fi++]);
    if (ri < rest.length) deck.push(rest[ri++]);
  }
  return deck;
}

export function nameById(data, id) {
  return data.names.find((n) => n.id === id) || null;
}
