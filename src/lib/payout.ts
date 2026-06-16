// Parimutuel payout engine.
//
// All bettors' stakes go into one pot. When the bet resolves, everyone who
// staked the winning option splits the WHOLE pot in proportion to how much
// they staked on that option. Losers lose their stake. This matches how the
// pot is described to the user (and their worked example):
//
//   You stake ₪50 (win), C stakes ₪10 (win), B stakes ₪60 (lose)
//   pot = 120, winningPool = 60
//   you  -> 50/60 * 120 = 100  => profit +50
//   C    -> 10/60 * 120 =  20  => profit +10
//   B    -> lost               => profit -60
//
// Amounts are in agorot (integers). Payouts are rounded to whole agorot and
// any rounding remainder is given to the largest winning stake so the pot
// always sums back to exactly the total.

export interface PositionInput {
  userId: string;
  optionId: string;
  amount: number; // agorot, > 0
}

export interface PayoutResult {
  userId: string;
  staked: number; // total this user put into the bet (agorot)
  payout: number; // what they get back (agorot)
  profit: number; // payout - staked (agorot; negative for losers)
  won: boolean;
}

/**
 * Compute per-user payouts for a resolved bet.
 *
 * If nobody staked the winning option, or there were no losers (everyone on
 * the winning side / a single side), the bet is a wash and everyone is
 * refunded exactly what they staked (profit 0).
 */
export function computePayouts(
  positions: PositionInput[],
  winningOptionId: string,
): PayoutResult[] {
  // Aggregate stakes per user (a user may have multiple positions).
  const stakedByUser = new Map<string, number>();
  const wonStakeByUser = new Map<string, number>();

  let totalPot = 0;
  let winningPool = 0;

  for (const p of positions) {
    totalPot += p.amount;
    stakedByUser.set(p.userId, (stakedByUser.get(p.userId) ?? 0) + p.amount);
    if (p.optionId === winningOptionId) {
      winningPool += p.amount;
      wonStakeByUser.set(
        p.userId,
        (wonStakeByUser.get(p.userId) ?? 0) + p.amount,
      );
    }
  }

  const losingPool = totalPot - winningPool;

  // Wash: refund everyone (no winning side, or no losing money to distribute).
  if (winningPool === 0 || losingPool === 0) {
    return [...stakedByUser.entries()].map(([userId, staked]) => ({
      userId,
      staked,
      payout: staked,
      profit: 0,
      won: (wonStakeByUser.get(userId) ?? 0) > 0,
    }));
  }

  // Distribute the whole pot to winners proportional to their winning stake.
  const winners = [...wonStakeByUser.entries()].sort((a, b) => b[1] - a[1]);

  const payoutByUser = new Map<string, number>();
  let distributed = 0;
  for (const [userId, wonStake] of winners) {
    const payout = Math.floor((wonStake * totalPot) / winningPool);
    payoutByUser.set(userId, payout);
    distributed += payout;
  }
  // Give the rounding remainder to the largest winning stake.
  const remainder = totalPot - distributed;
  if (remainder > 0 && winners.length > 0) {
    const top = winners[0][0];
    payoutByUser.set(top, (payoutByUser.get(top) ?? 0) + remainder);
  }

  return [...stakedByUser.entries()].map(([userId, staked]) => {
    const payout = payoutByUser.get(userId) ?? 0;
    return {
      userId,
      staked,
      payout,
      profit: payout - staked,
      won: (wonStakeByUser.get(userId) ?? 0) > 0,
    };
  });
}
