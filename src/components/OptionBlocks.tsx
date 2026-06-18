"use client";

import Avatar from "./Avatar";

export type BlockUser = { id: string; name: string; avatarUrl: string | null };

// Per-option picker: tap a friend to bar them from betting that option
// (e.g. stop Ofek betting on the "Ofek" option).
export default function OptionBlocks({
  options,
  users,
  value,
  onToggle,
}: {
  options: { key: string; label: string }[];
  users: BlockUser[];
  value: Record<string, string[]>;
  onToggle: (key: string, userId: string) => void;
}) {
  if (users.length === 0 || options.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {options.map((o) => (
        <div key={o.key}>
          <div className="mb-1.5 text-xs font-bold text-muted">
            חסום מהאפשרות &quot;{o.label}&quot;:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {users.map((u) => {
              const on = (value[o.key] ?? []).includes(u.id);
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => onToggle(o.key, u.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold transition ${
                    on ? "border-no bg-no-b text-no" : "border-border text-muted"
                  }`}
                >
                  <Avatar name={u.name} src={u.avatarUrl} size={18} />
                  {u.name}
                  {on && " ✕"}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
