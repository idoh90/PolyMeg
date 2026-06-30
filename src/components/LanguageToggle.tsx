"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { locales, type Locale } from "@/lib/i18n/config";

/**
 * Segmented Hebrew/English switch. Persists via POST /api/locale (cookie +
 * User.locale) then refreshes so server components re-render in the new locale
 * and the root <html dir> flips. `compact` is the smaller variant for the auth
 * screens; default is the settings-row variant.
 */
export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    });
  }

  const pad = compact ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2 text-[13.5px]";

  return (
    <div
      className="inline-flex rounded-full border border-border bg-surface-2 p-0.5"
      role="group"
      aria-label={dict.language.title}
    >
      {locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => choose(loc)}
            disabled={pending}
            aria-pressed={active}
            className={`pressable rounded-full font-extrabold transition disabled:opacity-60 ${pad} ${
              active ? "bg-accent text-white shadow-sm" : "text-muted"
            }`}
            style={{ direction: loc === "he" ? "rtl" : "ltr" }}
          >
            {dict.language[loc]}
          </button>
        );
      })}
    </div>
  );
}
