import { describe, it, expect } from "vitest";
import { netBalances, minimizeTransfers } from "./settlement";

const S = (n: number) => n * 100;

describe("settlement", () => {
  it("produces the user's worked example: B pays you ₪50 and C ₪10", () => {
    const balances = netBalances([
      { userId: "you", profit: S(50) },
      { userId: "C", profit: S(10) },
      { userId: "B", profit: -S(60) },
    ]);
    const transfers = minimizeTransfers(balances);

    // B should pay both winners; total out = 60.
    const fromB = transfers.filter((t) => t.fromUserId === "B");
    expect(fromB.reduce((s, t) => s + t.amount, 0)).toBe(S(60));

    const toYou = transfers.find((t) => t.toUserId === "you");
    const toC = transfers.find((t) => t.toUserId === "C");
    expect(toYou?.fromUserId).toBe("B");
    expect(toYou?.amount).toBe(S(50));
    expect(toC?.fromUserId).toBe("B");
    expect(toC?.amount).toBe(S(10));
  });

  it("nets profit/loss across multiple bets per user", () => {
    const balances = netBalances([
      { userId: "a", profit: S(30) },
      { userId: "a", profit: -S(10) }, // a nets +20
      { userId: "b", profit: -S(20) },
    ]);
    const a = balances.find((x) => x.userId === "a")!;
    expect(a.net).toBe(S(20));

    const transfers = minimizeTransfers(balances);
    expect(transfers).toEqual([
      { fromUserId: "b", toUserId: "a", amount: S(20) },
    ]);
  });

  it("settles a multi-party scenario and conserves money", () => {
    const balances = [
      { userId: "a", net: S(50) },
      { userId: "b", net: S(25) },
      { userId: "c", net: -S(40) },
      { userId: "d", net: -S(35) },
    ];
    const transfers = minimizeTransfers(balances);
    const totalMoved = transfers.reduce((s, t) => s + t.amount, 0);
    expect(totalMoved).toBe(S(75)); // total owed == total credited

    // Every debtor ends fully paid, every creditor fully received.
    const paidIn = new Map<string, number>();
    const received = new Map<string, number>();
    for (const t of transfers) {
      paidIn.set(t.fromUserId, (paidIn.get(t.fromUserId) ?? 0) + t.amount);
      received.set(t.toUserId, (received.get(t.toUserId) ?? 0) + t.amount);
    }
    expect(paidIn.get("c")).toBe(S(40));
    expect(paidIn.get("d")).toBe(S(35));
    expect(received.get("a")).toBe(S(50));
    expect(received.get("b")).toBe(S(25));
  });

  it("returns no transfers when everyone is square", () => {
    expect(minimizeTransfers([{ userId: "a", net: 0 }])).toEqual([]);
    expect(minimizeTransfers([])).toEqual([]);
  });
});
