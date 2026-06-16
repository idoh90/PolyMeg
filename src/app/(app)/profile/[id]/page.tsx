import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getCurrentUserId } from "@/lib/session";
import { formatAgorot } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import Avatar from "@/components/Avatar";
import MarketCard from "@/components/MarketCard";
import PortfolioChart from "@/components/PortfolioChart";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, meId] = await Promise.all([getProfile(id), getCurrentUserId()]);
  if (!profile) notFound();

  const { user, stats, portfolio, created, activity } = profile;
  const isMe = meId === user.id;
  const hasPortfolio = portfolio.points.length > 2;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        <Avatar name={user.name} src={user.avatarUrl} size={72} />
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {user.name}
            {isMe && <span className="text-sm font-normal text-muted">(אתה)</span>}
            {user.isAdmin && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-accent">
                מנהל
              </span>
            )}
          </h1>
          <p className="text-sm text-muted">
            חבר מאז {formatDateTime(user.createdAt)}
          </p>
        </div>
        <div className="text-end">
          <div className="text-xs tracking-wide text-muted">רווח/הפסד</div>
          <div
            className={`text-2xl font-bold ${
              stats.realizedNet > 0
                ? "text-yes"
                : stats.realizedNet < 0
                  ? "text-no"
                  : "text-muted"
            }`}
          >
            {stats.realizedNet > 0 ? "+" : ""}
            {formatAgorot(stats.realizedNet)}
          </div>
        </div>
      </div>

      {/* Portfolio chart */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-semibold">תיק לאורך זמן</h2>
        {hasPortfolio ? (
          <PortfolioChart series={portfolio} />
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            אין עדיין הימורים שהוכרעו — הגרף יתמלא ככל שהימורים נסגרים.
          </p>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="אחוז הצלחה" value={stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`} sub={`${stats.won} ניצחונות · ${stats.lost} הפסדים`} />
        <Stat label="סך הימורים" value={formatAgorot(stats.totalStaked)} />
        <Stat label="הימורים שהשתתף" value={String(stats.betsEntered)} />
        <Stat label="הימורים שיצר" value={String(stats.betsCreated)} />
      </section>

      {/* Trophies (placeholder for future special events) */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">🏆 גביעים</h2>
          <span className="text-xs text-muted">בקרוב</span>
        </div>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border text-2xl opacity-40"
            >
              🏆
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          אירועים מיוחדים ופרסים יופיעו כאן — תנו גביע למי שצדק.
        </p>
      </section>

      {/* Activity */}
      <section>
        <h2 className="mb-3 font-semibold">פעילות</h2>
        {activity.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
            עדיין לא הונחו הימורים.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activity.map((a) => (
              <li key={a.positionId}>
                <Link
                  href={`/bets/${a.marketId}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm transition hover:border-accent/60"
                >
                  <OutcomeTag outcome={a.outcome} />
                  <span className="min-w-0 flex-1 truncate">{a.title}</span>
                  <span className="text-muted">{a.optionLabel}</span>
                  <span className="w-20 text-right font-medium">
                    {formatAgorot(a.amount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bets created */}
      {created.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">הימורים שנוצרו</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {created.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function OutcomeTag({ outcome }: { outcome: "won" | "lost" | "pending" }) {
  const map = {
    won: "bg-yes-dim text-yes",
    lost: "bg-no-dim text-no",
    pending: "bg-surface-2 text-muted",
  };
  const label = { won: "ניצח", lost: "הפסיד", pending: "ממתין" };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[outcome]}`}
    >
      {label[outcome]}
    </span>
  );
}
