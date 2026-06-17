"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav({ myId }: { myId: string }) {
  const pathname = usePathname();

  const items = [
    {
      href: "/dashboard",
      label: "הימורים",
      icon: <path d="M3 3v18h18M19 9l-5 5-4-4-3 3" />,
      active: pathname === "/dashboard" || pathname.startsWith("/bets/"),
    },
    {
      href: "/leaderboard",
      label: "טבלה",
      icon: <path d="M8 21V10M16 21V4M3 21h18" />,
      active: pathname === "/leaderboard",
    },
    {
      href: `/profile/${myId}`,
      label: "התיק",
      icon: (
        <>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </>
      ),
      active: pathname.startsWith("/profile/"),
    },
    {
      href: "/settlement",
      label: "חשבון",
      icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
      active: pathname === "/settlement",
    },
  ];

  // The FAB sits between item index 1 and 2.
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[78px] max-w-[480px] items-start justify-around border-t border-border bg-surface px-2 pt-2.5">
      {items.slice(0, 2).map((it) => (
        <NavBtn key={it.href} {...it} />
      ))}
      <div className="flex-1" />
      {items.slice(2).map((it) => (
        <NavBtn key={it.href} {...it} />
      ))}

      <Link
        href="/bets/new"
        aria-label="הימור חדש"
        className="absolute left-1/2 top-[-20px] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-[18px] border-4 border-surface bg-accent text-white shadow-[0_10px_22px_-8px_var(--accent)] transition active:scale-95"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </nav>
  );
}

function NavBtn({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-1"
      style={{ color: active ? "var(--accent)" : "var(--faint)" }}
    >
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      <span className="text-[10.5px] font-bold">{label}</span>
    </Link>
  );
}
