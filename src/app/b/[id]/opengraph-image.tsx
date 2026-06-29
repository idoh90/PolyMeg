import { ImageResponse } from "next/og";
import { getPublicBet, toVisualRtl } from "@/lib/share";

export const alt = "GruBet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fetch a Satori-compatible TTF for the given glyphs from Google Fonts. The old
// User-Agent forces a .ttf response (modern UAs get woff2, which Satori can't
// parse). Cached per-glyph-set in module scope.
const fontCache = new Map<string, ArrayBuffer>();
async function heebo(text: string, weight: 700 | 800): Promise<ArrayBuffer | null> {
  const key = `${weight}:${text}`;
  const hit = fontCache.get(key);
  if (hit) return hit;
  try {
    const url = `https://fonts.googleapis.com/css2?family=Heebo:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (
      await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko)",
        },
      })
    ).text();
    const m = css.match(/src: url\((.+?)\) format/);
    if (!m) return null;
    const data = await (await fetch(m[1])).arrayBuffer();
    fontCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bet = await getPublicBet(id);

  const rawTitle = bet?.title ?? "GruBet";
  const emoji = bet?.emoji ?? "🎲";
  const isScalar = bet?.kind === "SCALAR";
  const rawHeadline = isScalar
    ? `${bet?.scalarMin}–${bet?.scalarMax}${bet?.scalarUnit ? " " + bet.scalarUnit : ""}`
    : `${bet?.topPct ?? 0}%`;
  const rawSub = isScalar ? "ניחוש המספר" : bet?.topLabel ?? "";
  const rawGroup = bet?.groupName ?? "";
  const potText = bet?.potText ?? "";

  // Satori has no bidi — hand it Hebrew already in visual order.
  const title = toVisualRtl(rawTitle);
  const headline = isScalar ? toVisualRtl(rawHeadline) : rawHeadline;
  const sub = toVisualRtl(rawSub);
  const groupName = toVisualRtl(rawGroup);
  const potLabel = toVisualRtl("קופה");

  // Subset fonts to just the glyphs we draw.
  const glyphs =
    "GruBet קופה ניחוש המספר משתתפים " + rawTitle + rawHeadline + rawSub + rawGroup + potText + "0123456789%₪–·";
  const [reg, bold] = await Promise.all([heebo(glyphs, 700), heebo(glyphs, 800)]);
  const fonts = [
    ...(reg ? [{ name: "Heebo", data: reg, weight: 700 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Heebo", data: bold, weight: 800 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg,#1f2a4d,#0f1320)",
          color: "#ffffff",
          fontFamily: "Heebo",
        }}
      >
        {/* brand + group */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 800 }}>
            <span>Gru</span>
            <span style={{ color: "#5b93f8" }}>Bet</span>
          </div>
          {groupName ? (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 700,
                color: "#aeb7c9",
                background: "rgba(255,255,255,.08)",
                padding: "10px 22px",
                borderRadius: 999,
              }}
            >
              {groupName}
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* question */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 132,
              borderRadius: 32,
              background: "rgba(255,255,255,.1)",
              fontSize: 78,
            }}
          >
            {emoji}
          </div>
          <div style={{ display: "flex", flex: 1, fontSize: 64, fontWeight: 800, lineHeight: 1.1, textAlign: "right" }}>
            {title}
          </div>
        </div>

        {/* odds + pot */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#23ca8e", lineHeight: 1 }}>
              {headline}
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#aeb7c9", marginTop: 8 }}>
              {sub}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#aeb7c9" }}>{potLabel}</div>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 800 }}>{potText}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined, emoji: "noto" },
  );
}
