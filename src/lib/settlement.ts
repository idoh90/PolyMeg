// Debt settlement engine ("who pays whom").
//
// Given each user's net profit/loss across ALL resolved bets (in agorot),
// produce the minimal-ish set of person-to-person transfers that settles
// everyone up. This is the classic greedy approach used by Splitwise-style
// apps: repeatedly take the biggest debtor and the biggest creditor and
// transfer min(|debt|, credit) between them.

export interface Balance {
  userId: string;
  net: number; // agorot; positive = is owed money, negative = owes money
}

export interface Transfer {
  fromUserId: string; // pays
  toUserId: string; // receives
  amount: number; // agorot, > 0
}

/**
 * Build net balances from per-bet payout results.
 * Each entry contributes its `profit` to that user's running net.
 */
export function netBalances(
  profits: { userId: string; profit: number }[],
): Balance[] {
  const byUser = new Map<string, number>();
  for (const { userId, profit } of profits) {
    byUser.set(userId, (byUser.get(userId) ?? 0) + profit);
  }
  return [...byUser.entries()].map(([userId, net]) => ({ userId, net }));
}

/**
 * Minimize the transfers needed to settle the given balances.
 * Sum of all `net` should be ~0 (it is, by construction, since every bet's
 * profits sum to zero). Any tiny residual is ignored.
 */
export function minimizeTransfers(balances: Balance[]): Transfer[] {
  // Creditors (net > 0) want to receive; debtors (net < 0) need to pay.
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ ...b, net: -b.net })) // store debt as a positive amount
    .sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.net, debt.net);

    if (amount > 0) {
      transfers.push({
        fromUserId: debt.userId,
        toUserId: credit.userId,
        amount,
      });
      credit.net -= amount;
      debt.net -= amount;
    }

    if (credit.net === 0) ci++;
    if (debt.net === 0) di++;
  }

  return transfers;
}
