"use client";

import { useEffect, useState } from "react";

// Brand splash shown over the first paint of the app shell ("App open" design).
// It mounts with the account layout, so it plays once per app open (a fresh load
// or login) and not on client navigation between in-app pages. The logo scales in
// while the whole panel fades up and out, then the overlay unmounts.
export default function AppSplash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // gb-splash runs 0.74s; give it a small tail before unmounting. Reduced-motion
    // users skip the motion entirely and the cover clears on the next frame.
    const t = setTimeout(() => setShow(false), reduced ? 0 : 780);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className="gb-splash pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg,#1f2a4d,#0b0e16)" }}
    >
      <div className="gb-logo flex items-center" style={{ gap: 11 }}>
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="13" width="5" height="8" rx="1.5" fill="#5b93f8" />
          <rect x="9.5" y="8" width="5" height="13" rx="1.5" fill="#7ba8fb" />
          <rect x="16" y="3" width="5" height="18" rx="1.5" fill="#9cc0ff" />
        </svg>
        <span className="font-black tracking-[-0.6px] text-white" style={{ fontSize: 32 }}>
          Gru<span style={{ color: "#5b93f8" }}>Bet</span>
        </span>
      </div>
    </div>
  );
}
