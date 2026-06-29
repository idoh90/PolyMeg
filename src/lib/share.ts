import bidiFactory from "bidi-js";
import { prisma } from "@/lib/db";
import { poolFor } from "@/lib/markets";
import { formatAgorot } from "@/lib/money";

const bidi = bidiFactory();

/**
 * Reorder a (possibly mixed RTL/LTR) string into visual order. Satori (next/og)
 * does not run the Unicode bidi algorithm, so Hebrew comes out reversed unless
 * we hand it text already in visual order.
 */
export function toVisualRtl(s: string): string {
  if (!s) return s;
  const levels = bidi.getEmbeddingLevels(s, "rtl");
  return bidi.getReorderedString(s, levels);
}

/** Absolute site origin for OG image URLs / deep links (no trailing slash). */
export function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type PublicBet = {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  emoji: string | null;
  kind: string;
  status: string;
  topLabel: string;
  topPct: number;
  scalarMin: number | null;
  scalarMax: number | null;
  scalarUnit: string | null;
  potText: string;
  betCount: number;
};

/** Public, auth-free snapshot of a bet for the share card + OG image. */
export async function getPublicBet(id: string): Promise<PublicBet | null> {
  const m = await prisma.market.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      emoji: true,
      kind: true,
      status: true,
      winningOptionId: true,
      scalarMin: true,
      scalarMax: true,
      scalarUnit: true,
      groupId: true,
      group: { select: { name: true } },
      options: { select: { id: true, label: true } },
      positions: { where: { soldAt: null }, select: { optionId: true, amount: true } },
    },
  });
  if (!m) return null;

  const { options, totalPot } = poolFor(m.options, m.positions, m.winningOptionId);
  const top = [...options].sort((a, b) => b.pct - a.pct)[0];

  return {
    id: m.id,
    groupId: m.groupId,
    groupName: m.group.name,
    title: m.title,
    emoji: m.emoji,
    kind: m.kind,
    status: m.status,
    topLabel: top?.label ?? "",
    topPct: top?.pct ?? 0,
    scalarMin: m.scalarMin,
    scalarMax: m.scalarMax,
    scalarUnit: m.scalarUnit,
    potText: formatAgorot(totalPot),
    betCount: m.positions.length,
  };
}
