"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EMOJI_OPTIONS, groupCategories } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import BackChevron from "@/components/BackChevron";

export default function NewGroupPage() {
  const { dict } = useT();
  const router = useRouter();
  const [emoji, setEmoji] = useState<string>(EMOJI_OPTIONS[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [joinMode, setJoinMode] = useState<"CODE" | "APPROVAL">("CODE");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);

  const canCreate = name.trim().length >= 2 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, emoji, category, joinMode, password: joinMode === "CODE" ? password : "" }),
    });
    if (res.ok) setCreated(await res.json());
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? dict.newGroup.createFailed);
    }
    setBusy(false);
  }

  function copy() {
    if (!created) return;
    navigator.clipboard?.writeText(created.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (created) {
    return (
      <div className="px-[18px] pb-8 pt-1.5">
        <Header />
        <div className="py-[18px] text-center">
          <div className="pm-pop mx-auto mb-[18px] flex h-20 w-20 items-center justify-center rounded-full bg-yes-b">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--yes)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div className="mb-1.5 text-[23px] font-extrabold">{dict.newGroup.ready}</div>
          <div dir="auto" className="mb-[22px] text-sm font-semibold text-muted">{emoji} {name}</div>
          <div className="mb-4 rounded-[20px] p-[22px] text-white" style={{ background: "linear-gradient(135deg,#1f2a4d,#0f1320)" }}>
            <div className="mb-2.5 text-xs font-bold tracking-[0.4px] text-[#aeb7c9]">{dict.newGroup.shareCode}</div>
            <div className="text-[34px] font-black tracking-[3px]" style={{ direction: "ltr", fontFamily: "'SF Mono',ui-monospace,monospace" }}>{created.code}</div>
          </div>
          <button onClick={copy} className="pressable mb-3.5 flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-border bg-surface py-3.5 text-[14.5px] font-extrabold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
            {copied ? dict.newGroup.copied : dict.newGroup.copyCode}
          </button>
          <button
            onClick={() => { router.push(`/g/${created.id}`); router.refresh(); }}
            className="pressable w-full rounded-[15px] bg-accent py-4 text-base font-extrabold text-white"
          >
            {dict.newGroup.enterGroup}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      <Header />
      <div className="mb-1 text-2xl font-extrabold">{dict.newGroup.title}</div>
      <div className="mb-5 text-[13.5px] font-semibold text-muted">{dict.newGroup.subtitle}</div>

      <form onSubmit={submit}>
        <label className="mb-[9px] block text-[12.5px] font-extrabold text-muted">{dict.newGroup.emojiLabel}</label>
        <div className="mb-[18px] flex gap-2 overflow-x-auto pb-1">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px] border-[1.5px] text-[23px]"
              style={{ borderColor: emoji === e ? "var(--accent)" : "var(--border)", background: emoji === e ? "var(--accent-soft)" : "var(--surface)" }}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-[12.5px] font-extrabold text-muted">{dict.newGroup.nameLabel}</label>
        <div data-field className="mb-3.5 rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
          <input value={name} onChange={(e) => setName(e.target.value)} dir="auto" placeholder={dict.newGroup.namePlaceholder} className="w-full bg-transparent text-[15.5px] font-bold outline-none" required />
        </div>

        <label className="mb-1.5 block text-[12.5px] font-extrabold text-muted">{dict.newGroup.category} <span className="font-semibold text-faint">{dict.common.optional}</span></label>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {groupCategories(dict).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory((cur) => (cur === c ? "" : c))}
              className="rounded-full border px-[13px] py-2 text-[13px] font-bold"
              style={{
                borderColor: category === c ? "var(--accent)" : "var(--border)",
                background: category === c ? "var(--accent-soft)" : "var(--surface)",
                color: category === c ? "var(--accent)" : "var(--muted)",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-[12.5px] font-extrabold text-muted">{dict.newGroup.description} <span className="font-semibold text-faint">{dict.common.optional}</span></label>
        <div data-field className="mb-5 rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-3">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} dir="auto" rows={2} placeholder={dict.newGroup.descriptionPlaceholder} className="w-full resize-none bg-transparent text-[14.5px] font-semibold outline-none" />
        </div>

        <label className="mb-[9px] block text-[12.5px] font-extrabold text-muted">{dict.newGroup.howJoin}</label>
        <div className="mb-4 flex gap-1.5 rounded-[14px] bg-surface-2 p-[5px]">
          {(["CODE", "APPROVAL"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setJoinMode(m)}
              className={`flex-1 rounded-[10px] py-3 text-[13.5px] font-extrabold transition ${joinMode === m ? "bg-surface text-text shadow-[0_1px_3px_rgba(15,19,32,.1)]" : "text-muted"}`}
            >
              {m === "CODE" ? dict.newGroup.openCode : dict.newGroup.ownerApproval}
            </button>
          ))}
        </div>

        {joinMode === "CODE" ? (
          <>
            <div className="mb-3.5 flex items-start gap-[9px] rounded-[14px] bg-accent-soft px-[15px] py-[13px]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px flex-none"><path d="M12 16v-4M12 8h.01" /><circle cx="12" cy="12" r="9" /></svg>
              <span className="text-[12.5px] font-semibold leading-[1.5] text-[#2257c4]">{dict.newGroup.codeHint}</span>
            </div>
            <label className="mb-1.5 block text-[12.5px] font-extrabold text-muted">{dict.newGroup.groupPassword} <span className="font-semibold text-faint">{dict.common.optional}</span></label>
            <div data-field className="rounded-[14px] border-[1.5px] border-border bg-surface px-[15px] py-[13px]">
              <input value={password} onChange={(e) => setPassword(e.target.value)} dir="auto" placeholder={dict.newGroup.noPassword} className="w-full bg-transparent text-[15px] font-semibold outline-none" />
            </div>
          </>
        ) : (
          <div className="flex items-start gap-[9px] rounded-[14px] bg-surface-2 px-[15px] py-[13px]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px flex-none"><path d="M12 16v-4M12 8h.01" /><circle cx="12" cy="12" r="9" /></svg>
            <span className="text-[12.5px] font-semibold leading-[1.5] text-muted">{dict.newGroup.approvalHint}</span>
          </div>
        )}

        {error && <p className="mt-3 text-sm font-semibold text-no">{error}</p>}

        <button type="submit" disabled={!canCreate} className="mt-[18px] w-full rounded-[15px] bg-accent py-4 text-[16.5px] font-extrabold text-white shadow-[0_12px_24px_-12px_var(--accent)] disabled:opacity-50">
          {busy ? dict.newGroup.creating : dict.newGroup.create}
        </button>
      </form>
    </div>
  );
}

function Header() {
  const { dict } = useT();
  return (
    <div className="mb-[18px] flex items-center gap-3">
      <Link href="/groups" className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface">
        <BackChevron />
      </Link>
      <span className="text-[15px] font-extrabold text-muted">{dict.groups.newGroup}</span>
    </div>
  );
}
