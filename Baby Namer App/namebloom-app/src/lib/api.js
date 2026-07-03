import { isSupabaseConfigured } from "./supabase.js";
import { demoStore } from "./demoStore.js";
import { supabaseStore } from "./supabaseStore.js";

export const store = isSupabaseConfigured ? supabaseStore : demoStore;
export const DEMO = store.mode === "demo";

/**
 * Compute matches from the full set of swipes for a project.
 * A match = every project member liked the same name.
 * Returns array of { nameId, superMatch, likedBy: [userIds] }.
 */
export function computeMatches(swipes, memberIds) {
  const byName = new Map();
  for (const s of swipes) {
    if (!s.liked) continue;
    if (!byName.has(s.nameId)) byName.set(s.nameId, { likedBy: new Set(), superliked: new Set() });
    const rec = byName.get(s.nameId);
    rec.likedBy.add(s.userId);
    if (s.superliked) rec.superliked.add(s.userId);
  }
  const matches = [];
  for (const [nameId, rec] of byName) {
    const everyone = memberIds.length > 0 && memberIds.every((m) => rec.likedBy.has(m));
    if (everyone) {
      matches.push({
        nameId,
        superMatch: rec.superliked.size > 0,
        likedBy: [...rec.likedBy],
      });
    }
  }
  return matches;
}

/** Names the partner has already liked but I haven't swiped — used for a live hint. */
export function partnerLikedIds(swipes, myId) {
  const s = new Set();
  for (const sw of swipes) if (sw.userId !== myId && sw.liked) s.add(sw.nameId);
  return s;
}
