"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Avatar from "./Avatar";

type Props = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  unread: number;
};

export default function NavBar({
  userId,
  name,
  avatarUrl,
  isAdmin,
  unread,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "הימורים" },
    { href: "/people", label: "אנשים" },
    { href: "/settlement", label: "התחשבנות" },
    ...(isAdmin ? [{ href: "/admin", label: "ניהול" }] : []),
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/lock");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
        <Link href="/dashboard" className="mr-2 text-xl font-bold tracking-tight">
          Poly<span className="text-accent">meg</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-surface-2 text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative rounded-full p-2 text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="התראות"
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-no px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <Link
            href="/bets/new"
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-black transition hover:opacity-90"
          >
            + הימור חדש
          </Link>

          <Link
            href={`/profile/${userId}`}
            className="rounded-full transition hover:opacity-80"
            title="הפרופיל שלי"
          >
            <Avatar name={name} src={avatarUrl} size={30} />
          </Link>

          <button
            onClick={logout}
            className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:bg-surface-2 hover:text-text"
            title="התנתק"
          >
            התנתק
          </button>
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
