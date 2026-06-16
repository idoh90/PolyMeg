import { describe, it, expect } from "vitest";
import { computePayouts } from "./payout";

const S = (n: number) => n * 100; // shekels -> agorot helper for readability

describe("computePayouts (parimutuel)", () => {
  it("matches the user's worked example", () => {
    // YES wins. You(+50) and C(+10) staked YES; B(60) staked NO.
    const results = computePayouts(
      [
        { userId: "you", optionId: "YES", amount: S(50) },
        { userId: "C", optionId: "YES", amount: S(10) },
        { userId: "B", optionId: "NO", amount: S(60) },
      ],
      "YES",
    );
    const byUser = Object.fromEntries(results.map((r) => [r.userId, r]));

    expect(byUser.you.payout).toBe(S(100));
    expect(byUser.you.profit).toBe(S(50));
    expect(byUser.C.payout).toBe(S(20));
    expect(byUser.C.profit).toBe(S(10));
    expect(byUser.B.profit).toBe(-S(60));

    // Pot is conserved: sum of payouts == sum of stakes.
    const totalStaked = results.reduce((s, r) => s + r.staked, 0);
    const totalPaid = results.reduce((s, r) => s + r.payout, 0);
    expect(totalPaid).toBe(totalStaked);
    // Profits sum to zero.
    expect(results.reduce((s, r) => s + r.profit, 0)).toBe(0);
  });

  it("refunds everyone when nobody staked the winning option", () => {
    const results = computePayouts(
      [
        { userId: "a", optionId: "NO", amount: S(30) },
        { userId: "b", optionId: "NO", amount: S(20) },
      ],
      "YES",
    );
    for (const r of results) expect(r.profit).toBe(0);
    expect(results.find((r) => r.userId === "a")?.payout).toBe(S(30));
  });

  it("refunds everyone when there are no losers", () => {
    const results = computePayouts(
      [
        { userId: "a", optionId: "YES", amount: S(30) },
        { userId: "b", optionId: "YES", amount: S(20) },
      ],
      "YES",
    );
    for (const r of results) expect(r.profit).toBe(0);
  });

  it("conserves the pot when payouts don't divide evenly", () => {
    // pot=100, winningPool=30 (10+10+10), three equal winners; 100/3 not exact.
    const results = computePayouts(
      [
        { userId: "a", optionId: "YES", amount: S(10) },
        { userId: "b", optionId: "YES", amount: S(10) },
        { userId: "c", optionId: "YES", amount: S(10) },
        { userId: "d", optionId: "NO", amount: S(70) },
      ],
      "YES",
    );
    const totalPaid = results.reduce((s, r) => s + r.payout, 0);
    expect(totalPaid).toBe(S(100)); // remainder absorbed, nothing lost
  });

  it("aggregates multiple positions from the same user", () => {
    const results = computePayouts(
      [
        { userId: "a", optionId: "YES", amount: S(20) },
        { userId: "a", optionId: "YES", amount: S(30) },
        { userId: "b", optionId: "NO", amount: S(50) },
      ],
      "YES",
    );
    const a = results.find((r) => r.userId === "a")!;
    expect(a.staked).toBe(S(50));
    expect(a.payout).toBe(S(100));
    expect(a.profit).toBe(S(50));
  });
});
