import Link from "next/link";
import { getSettlement } from "@/lib/settlementData";
import { getCurrentUser } from "@/lib/currentUser";
import { formatAgorot } from "@/lib/money";
import Avatar from "@/components/Avatar";

function signed(n: number) {
  return `${n > 0 ? "+" : ""}${formatAgorot(n)}`;
}

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await getCurrentUser();
  const { balances, transfers } = await getSettlement(groupId);
  const base = `/g/${groupId}`;

  const mine = transfers.filter(
    (t) => t.fromUserId === user?.id || t.toUserId === user?.id,
  );

  return (
    <div className="px-[18px] pb-8 pt-1.5">
      <h1 className="text-2xl font-extrabold">התחשבנות</h1>
      <p className="mb-[18px] mt-1 text-[13.5px] font-semibold leading-relaxed text-muted">
        מאזן כולל מכל ההימורים שהוכרעו. הכסף לא עובר באפליקציה — שלמו אחד לשני ישירות.
      </p>

      {/* your settle-up */}
      {user && (
        <div className="mb-5 rounded-[18px] border-[1.5px] border-accent-soft bg-surface p-4 shadow-[0_8px_22px_-16px_var(--accent)]">
          <div className="mb-3 text-sm font-extrabold">ההתחשבנות שלך</div>
          {mine.length === 0 ? (
            <p className="text-sm font-semibold text-muted">אתה מאוזן. אין מה לשלם או לגבות.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {mine.map((t, i) => {
                const youPay = t.fromUserId === user.id;
                const other = youPay
                  ? { id: t.toUserId, name: t.toName }
                  : { id: t.fromUserId, name: t.fromName };
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: youPay ? "var(--no-b)" : "var(--yes-b)" }}
                  >
                    <Avatar name={other.name} size={34} />
                    <span className="flex-1 text-sm font-bold">
                      {youPay ? "שלם ל־" : "גבה מ־"}
                      <strong>{other.name}</strong>
                    </span>
                    <span
                      className="text-base font-extrabold"
                      style={{ color: youPay ? "var(--no)" : "var(--yes)" }}
                    >
                      {formatAgorot(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* who pays whom */}
      <div className="mb-2.5 text-base font-extrabold">מי משלם למי</div>
      {transfers.length === 0 ? (
        <p className="mb-5 rounded-[14px] border border-dashed border-border p-6 text-center text-sm text-muted">
          אין חובות עדיין — הכריעו כמה הימורים קודם.
        </p>
      ) : (
        <div className="mb-5 flex flex-col gap-2.5">
          {transfers.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-[14px] border border-border bg-surface px-3.5 py-3 text-[13.5px] font-bold"
            >
              <span>{t.fromName}</span>
              <svg width="20" height="14" viewBox="0 0 24 14" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
                <path d="M2 7h18m0 0-6-5m6 5-6 5" />
              </svg>
              <span>{t.toName}</span>
              <span className="me-auto text-[15px] font-extrabold">{formatAgorot(t.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* net standings */}
      <div className="mb-2.5 text-base font-extrabold">מאזן כולל</div>
      <div className="flex flex-col gap-2">
        {balances.map((b) => (
          <Link
            href={`${base}/u/${b.userId}`}
            key={b.userId}
            className="flex items-center gap-2.5 rounded-[13px] border border-border bg-surface px-3.5 py-2.5"
          >
            <Avatar name={b.name} src={b.avatarUrl} size={30} />
            <span className="flex-1 text-sm font-bold">
              {b.name}
              {b.userId === user?.id && <span className="font-semibold text-muted"> (אתה)</span>}
            </span>
            <span
              className="text-[14.5px] font-extrabold"
              style={{ color: b.net > 0 ? "var(--yes)" : b.net < 0 ? "var(--no)" : "var(--muted)" }}
            >
              {signed(b.net)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
