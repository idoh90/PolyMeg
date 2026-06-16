"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Marks the user's notifications read on mount, then refreshes so the nav
// badge clears.
export default function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!hasUnread) return;
    fetch("/api/notifications/read", { method: "POST" }).then(() =>
      router.refresh(),
    );
  }, [hasUnread, router]);
  return null;
}
