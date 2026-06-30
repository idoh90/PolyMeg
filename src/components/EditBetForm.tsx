"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OptionBlocks, { type BlockUser } from "@/components/OptionBlocks";
import { useT } from "@/lib/i18n/provider";

export interface EditInitial {
  id: string;
  title: string;
  criteria: string;
  imageUrl: string | null;
  minStakeShekels: number;
  closesAtISO: string;
  options: { id: string; label: string; blockedUserIds: string[] }[];
}

function fileToDataUrl(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function EditBetForm({
  initial,
  users,
}: {
  initial: EditInitial;
  users: BlockUser[];
}) {
  const { dict } = useT();
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [criteria, setCriteria] = useState(initial.criteria);
  const [imageUrl, setImageUrl] = useState<string | null>(initial.imageUrl);
  const [minStake, setMinStake] = useState(String(initial.minStakeShekels));
  const [closesAt, setClosesAt] = useState(toLocalInput(initial.closesAtISO));
  const [blocks, setBlocks] = useState<Record<string, string[]>>(
    Object.fromEntries(initial.options.map((o) => [o.id, o.blockedUserIds])),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUrl(await fileToDataUrl(file));
    } catch {
      setError(dict.newBet.imageReadFailed);
    }
  }

  function toggleBlock(key: string, userId: string) {
    setBlocks((prev) => {
      const cur = prev[key] ?? [];
      return {
        ...prev,
        [key]: cur.includes(userId) ? cur.filter((u) => u !== userId) : [...cur, userId],
      };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch(`/api/markets/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        criteria,
        imageUrl,
        minStake: Number(minStake),
        closesAt: new Date(closesAt).toISOString(),
        blocks,
      }),
    });
    if (res.ok) {
      router.push(`/bets/${initial.id}`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? dict.editBet.editFailed);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{dict.editBet.titleLabel}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="ebinput" required />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{dict.editBet.criteria}</span>
        <textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} rows={3} className="ebinput resize-none" required />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{dict.newBet.image}</span>
        <div className="flex items-center gap-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          )}
          <input type="file" accept="image/*" onChange={onPickImage} className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-text" />
        </div>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{dict.editBet.minStake}</span>
          <input type="number" min={0} step="1" value={minStake} onChange={(e) => setMinStake(e.target.value)} className="ebinput" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{dict.editBet.closesOn}</span>
          <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="ebinput" required />
        </label>
      </div>

      {users.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            {dict.editBet.blocks} <span className="font-normal text-muted">{dict.editBet.blocksHint}</span>
          </span>
          <OptionBlocks
            options={initial.options.map((o) => ({ key: o.id, label: o.label }))}
            users={users}
            value={blocks}
            onToggle={toggleBlock}
          />
        </label>
      )}

      {error && <p className="text-sm text-no">{error}</p>}

      <button type="submit" disabled={busy} className="rounded-full bg-accent py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
        {busy ? dict.common.saving : dict.common.saveChanges}
      </button>

      <style>{`
        .ebinput { width:100%; border-radius:.5rem; border:1px solid var(--border); background:var(--surface); padding:.5rem .75rem; color:var(--text); outline:none; }
        .ebinput:focus { border-color: var(--accent); }
      `}</style>
    </form>
  );
}
