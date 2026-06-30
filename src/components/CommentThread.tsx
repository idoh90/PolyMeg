"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import ReactionBar from "@/components/ReactionBar";
import { timeUntil } from "@/lib/format";
import { displayLabel } from "@/lib/markets";
import { useT } from "@/lib/i18n/provider";
import { interpolate } from "@/lib/i18n/interpolate";
import type { CommentView } from "@/lib/comments";
import type { Member } from "@/lib/social";

const KIND_HEX = { yes: "var(--yes)", no: "var(--no)", accent: "var(--accent)" } as const;
const KIND_BG = { yes: "var(--yes-b)", no: "var(--no-b)", accent: "var(--accent-soft)" } as const;

export default function CommentThread({
  marketId,
  isAdmin,
  members,
  comments,
}: {
  marketId: string;
  isAdmin: boolean;
  members: Member[];
  comments: CommentView[];
}) {
  const { dict } = useT();
  const router = useRouter();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<Member[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const total = comments.reduce((n, c) => n + 1 + c.children.length, 0);

  function onChange(v: string) {
    setText(v);
    const m = v.match(/@([\w.]*)$/);
    if (m) {
      const q = m[1].toLowerCase();
      setSuggest(
        members
          .filter((mem) => mem.username.toLowerCase().includes(q) || mem.displayName.toLowerCase().includes(q))
          .slice(0, 5),
      );
    } else setSuggest([]);
  }

  function pickMention(mem: Member) {
    setText((v) => v.replace(/@([\w.]*)$/, `@${mem.username} `));
    setSuggest([]);
    taRef.current?.focus();
  }

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const res = await fetch(`/api/markets/${marketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, parentId: replyTo?.id ?? null }),
    });
    setBusy(false);
    if (res.ok) {
      setText("");
      setReplyTo(null);
      setSuggest([]);
      router.refresh();
    }
  }

  async function del(id: string) {
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function Body({ body }: { body: string }) {
    const parts = body.split(/(@[\w.]+)/g);
    return (
      <span dir="auto" className="text-[14px] leading-[1.5]">
        {parts.map((p, i) => {
          const isMention = /^@[\w.]+$/.test(p) && members.some((m) => `@${m.username}`.toLowerCase() === p.toLowerCase());
          return isMention ? (
            <span key={i} className="font-extrabold text-accent">{p}</span>
          ) : (
            <span key={i}>{p}</span>
          );
        })}
      </span>
    );
  }

  function Item({ c, reply }: { c: CommentView; reply: boolean }) {
    return (
      <div className={reply ? "ms-[42px] mt-2.5" : ""}>
        <div className="flex items-start gap-2.5">
          <Avatar name={c.author.name} src={c.author.avatarUrl} size={reply ? 30 : 34} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span dir="auto" className="text-[13.5px] font-extrabold">{c.author.name}</span>
              {c.badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold"
                  style={{ color: KIND_HEX[c.badge.kind], background: KIND_BG[c.badge.kind] }}
                >
                  {displayLabel(c.badge.label, dict)} · {c.badge.amount}
                </span>
              )}
              <span className="text-[11px] font-semibold text-faint">{timeUntil(new Date(c.ts), dict.time)}</span>
            </div>
            <div className="mt-0.5"><Body body={c.body} /></div>
            <div className="mt-1.5 flex items-center gap-3">
              <ReactionBar commentId={c.id} initial={c.reactions} />
              {!reply && (
                <button onClick={() => { setReplyTo({ id: c.id, name: c.author.name }); taRef.current?.focus(); }} className="text-[12px] font-extrabold text-muted">
                  {dict.comments.reply}
                </button>
              )}
              {(c.mine || isAdmin) && (
                <button onClick={() => del(c.id)} className="text-[12px] font-bold text-faint">{dict.comments.delete}</button>
              )}
            </div>
          </div>
        </div>
        {c.children.map((ch) => <Item key={ch.id} c={ch} reply />)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 text-[15px] font-extrabold">{dict.comments.title} {total > 0 && <span className="text-muted">· {total}</span>}</div>

      {comments.length === 0 ? (
        <div className="mb-4 rounded-[14px] border border-dashed border-border p-5 text-center text-[13px] font-semibold text-muted">
          {dict.comments.empty}
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-4">
          {comments.map((c) => <Item key={c.id} c={c} reply={false} />)}
        </div>
      )}

      {/* composer */}
      {replyTo && (
        <div className="mb-1.5 flex items-center justify-between rounded-t-[12px] bg-surface-2 px-3 py-1.5 text-[12px] font-bold text-muted">
          <span>{interpolate(dict.comments.replyingTo, { name: replyTo.name })}</span>
          <button onClick={() => setReplyTo(null)} className="text-faint">{dict.common.cancel}</button>
        </div>
      )}
      <div className="relative">
        {suggest.length > 0 && (
          <div className="absolute bottom-full mb-1.5 w-full overflow-hidden rounded-[12px] border border-border bg-surface shadow-[0_8px_24px_-12px_rgba(15,19,32,.3)]">
            {suggest.map((m) => (
              <button key={m.id} onClick={() => pickMention(m)} className="flex w-full items-center gap-2.5 px-3 py-2 text-start hover:bg-surface-2">
                <Avatar name={m.displayName} size={26} />
                <span className="text-[13.5px] font-bold">{m.displayName}</span>
                <span className="text-[12px] font-semibold text-faint" style={{ direction: "ltr" }}>@{m.username}</span>
              </button>
            ))}
          </div>
        )}
        <div data-field className="flex items-end gap-2 rounded-[14px] border-[1.5px] border-border bg-surface px-3.5 py-2">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            dir="auto"
            rows={1}
            placeholder={dict.comments.placeholder}
            className="max-h-28 w-full resize-none bg-transparent py-1.5 text-[14.5px] font-medium outline-none"
          />
          <button
            onClick={send}
            disabled={busy || !text.trim()}
            className="mb-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent text-white disabled:opacity-40"
            aria-label={dict.comments.send}
          >
            <svg className="rtl-flip" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
