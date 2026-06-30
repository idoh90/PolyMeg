// Shared helpers + constants for the social/banter layer (comments, reactions,
// trash-talk). Pure functions — safe to import on client or server.

import type { Dictionary } from "@/lib/i18n";

export const REACTION_EMOJI = ["🔥", "😂", "💀", "🤡"] as const;

/** Localized one-tap trash-talk presets for the shout bar. */
export function trashTalkLines(dict: Dictionary): readonly string[] {
  return dict.trashTalk.list;
}

export const MAX_COMMENT_LEN = 500;
export const MAX_SHOUT_LEN = 40;

export type Member = { id: string; username: string; displayName: string };

/**
 * Extract mentioned account ids from comment text. Matches `@username`
 * (word-ish) and exact `@displayName`. Returns unique ids, excluding self
 * is left to the caller.
 */
export function parseMentions(body: string, members: Member[]): string[] {
  const ids = new Set<string>();
  for (const m of members) {
    const uname = m.username.toLowerCase();
    // @username token (letters, digits, dot, underscore)
    const re = new RegExp(`@${uname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w.])`, "i");
    if (re.test(body) || body.includes(`@${m.displayName}`)) ids.add(m.id);
  }
  return [...ids];
}

export type ReactionRow = { emoji: string; userId: string };
export type GroupedReaction = { emoji: string; count: number; mine: boolean };

/** Collapse raw reaction rows into ordered {emoji,count,mine} pills. */
export function groupReactions(rows: ReactionRow[], myId: string | null): GroupedReaction[] {
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const r of rows) {
    const cur = map.get(r.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (r.userId === myId) cur.mine = true;
    map.set(r.emoji, cur);
  }
  const order = (e: string) => {
    const i = (REACTION_EMOJI as readonly string[]).indexOf(e);
    return i === -1 ? 99 : i;
  };
  return [...map.entries()]
    .map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
    .sort((a, b) => order(a.emoji) - order(b.emoji));
}
