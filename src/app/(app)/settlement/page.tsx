import Link from "next/link";
import { getSettlement } from "@/lib/settlementData";
import { getCurrentUser } from "@/lib/currentUser";
import { formatAgorot } from "@/lib/money";
import Avatar from "@/components/Avatar";

export default async function SettlementPage() {
  const user = await getCurrentUser();
  const { balances, transfers } = await getSettlement();

  const myTransfers = transfers.filter(
    (t) => t.fromUserId === user?.id || t.toUserId === user?.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">התחשבנות</h1>
        <p className="text-sm text-muted">
          מאזן כולל מכל ההימורים שהוכרעו, והדרך הפשוטה ביותר לסגור חשבון. הכסף לא
          עובר באפליקציה — שלמו אחד לשני ישירות.
        </p>
      </div>

      {/* Your action items */}
      {user && (
        <section className="rounded-2xl border border-accent/40 bg-surface p-4">
          <h2 className="mb-3 font-semibold">ההתחשבנות שלך</h2>
          {myTransfers.length === 0 ? (
            <p className="text-sm text-muted">אתה מאוזן. אין מה לשלם או לגבות.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {myTransfers.map((t, i) => {
                const youPay = t.fromUserId === user.id;
                return (
                  <li
                    key={i}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      youPay ? "bg-no-dim" : "bg-yes-dim"
                    }`}
                  >
                    <span className="text-sm">
                      {youPay ? (
                        <>
                          שלם ל<strong>{t.toName}</strong>
                        </>
                      ) : (
                        <>
                          גבה מ<strong>{t.fromName}</strong>
                        </>
                      )}
                    </span>
                    <span
                      className={`font-bold ${youPay ? "text-no" : "text-yes"}`}
                    >
                      {formatAgorot(t.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* All transfers */}
      <section>
        <h2 className="mb-3 font-semibold">מי משלם למי</h2>
        {transfers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
            אין חובות עדיין — הכריעו כמה הימורים קודם.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {transfers.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <strong>{t.fromName}</strong>
                <span className="text-muted">משלם ל־</span>
                <strong>{t.toName}</strong>
                <span className="ms-auto font-semibold">
                  {formatAgorot(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Net standings */}
      <section>
        <h2 className="mb-3 font-semibold">מאזן כולל</h2>
        <div className="flex flex-col gap-1.5">
          {balances.map((b) => (
            <Link
              key={b.userId}
              href={`/profile/${b.userId}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2 transition hover:border-accent/60"
            >
              <Avatar name={b.name} src={b.avatarUrl} size={28} />
              <span className="flex-1 text-sm">
                {b.name}
                {b.userId === user?.id && (
                  <span className="ms-1 text-muted">(אתה)</span>
                )}
              </span>
              <span
                className={`font-semibold ${
                  b.net > 0 ? "text-yes" : b.net < 0 ? "text-no" : "text-muted"
                }`}
              >
                {b.net > 0 ? "+" : ""}
                {formatAgorot(b.net)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
