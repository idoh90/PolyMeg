// Creates temporary demo data with time-spread positions so the price-history
// and portfolio charts have something to show. Clear it afterwards with
// scripts/clear-data.mjs.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const DAY = 86400_000;
const ago = (d) => new Date(Date.now() - d * DAY);

async function main() {
  await p.notification.deleteMany();
  await p.position.deleteMany();
  await p.option.deleteMany();
  await p.market.deleteMany();

  const u = Object.fromEntries(
    (await p.user.findMany({ select: { id: true, name: true } })).map((x) => [
      x.name,
      x.id,
    ]),
  );
  const S = (n) => n * 100;

  // --- Bet A: binary, resolved (Yes won) ---
  const a = await p.market.create({
    data: {
      creatorId: u["Ido"],
      title: "Will Omri show up on time Friday?",
      criteria: "YES if Omri arrives before 20:00.",
      minStake: S(5),
      closesAt: ago(1),
      createdAt: ago(6),
      status: "RESOLVED",
      resolvedAt: ago(1),
      options: { create: [{ label: "Yes", sortOrder: 0 }, { label: "No", sortOrder: 1 }] },
    },
    include: { options: true },
  });
  const aYes = a.options.find((o) => o.label === "Yes").id;
  const aNo = a.options.find((o) => o.label === "No").id;
  await p.market.update({ where: { id: a.id }, data: { winningOptionId: aYes } });
  await p.position.createMany({
    data: [
      { marketId: a.id, optionId: aYes, userId: u["Ido"], amount: S(50), createdAt: ago(5.5) },
      { marketId: a.id, optionId: aNo, userId: u["Omri"], amount: S(40), createdAt: ago(5) },
      { marketId: a.id, optionId: aYes, userId: u["Elad"], amount: S(20), createdAt: ago(3.5) },
      { marketId: a.id, optionId: aNo, userId: u["Yanai"], amount: S(30), createdAt: ago(2) },
    ],
  });

  // --- Bet B: multiple choice, resolved (Omri won) ---
  const b = await p.market.create({
    data: {
      creatorId: u["Elad"],
      title: "Who wins FIFA night?",
      criteria: "Winner of the tournament.",
      minStake: S(10),
      closesAt: ago(0.5),
      createdAt: ago(4),
      status: "RESOLVED",
      resolvedAt: ago(0.5),
      options: {
        create: [
          { label: "Omri", sortOrder: 0 },
          { label: "Elad", sortOrder: 1 },
          { label: "Ido", sortOrder: 2 },
        ],
      },
    },
    include: { options: true },
  });
  const bOmri = b.options.find((o) => o.label === "Omri").id;
  const bElad = b.options.find((o) => o.label === "Elad").id;
  const bIdo = b.options.find((o) => o.label === "Ido").id;
  await p.market.update({ where: { id: b.id }, data: { winningOptionId: bOmri } });
  await p.position.createMany({
    data: [
      { marketId: b.id, optionId: bOmri, userId: u["Omri"], amount: S(30), createdAt: ago(3.5) },
      { marketId: b.id, optionId: bElad, userId: u["Elad"], amount: S(40), createdAt: ago(3) },
      { marketId: b.id, optionId: bIdo, userId: u["Ido"], amount: S(25), createdAt: ago(2.5) },
      { marketId: b.id, optionId: bOmri, userId: u["Ido"], amount: S(15), createdAt: ago(1.2) },
    ],
  });

  // --- Bet C: binary, still OPEN, with live time-spread positions ---
  const c = await p.market.create({
    data: {
      creatorId: u["Ido"],
      title: "Will it rain in Tel Aviv this weekend?",
      criteria: "YES if any measurable rain Sat-Sun.",
      minStake: S(5),
      closesAt: new Date(Date.now() + 2 * DAY),
      createdAt: ago(3),
      status: "OPEN",
      options: { create: [{ label: "Yes", sortOrder: 0 }, { label: "No", sortOrder: 1 }] },
    },
    include: { options: true },
  });
  const cYes = c.options.find((o) => o.label === "Yes").id;
  const cNo = c.options.find((o) => o.label === "No").id;
  await p.position.createMany({
    data: [
      { marketId: c.id, optionId: cNo, userId: u["Omri"], amount: S(20), createdAt: ago(2.8) },
      { marketId: c.id, optionId: cYes, userId: u["Ido"], amount: S(30), createdAt: ago(2.2) },
      { marketId: c.id, optionId: cNo, userId: u["Elad"], amount: S(25), createdAt: ago(1.5) },
      { marketId: c.id, optionId: cYes, userId: u["Yanai"], amount: S(40), createdAt: ago(0.8) },
      { marketId: c.id, optionId: cNo, userId: u["Ofek"], amount: S(15), createdAt: ago(0.2) },
    ],
  });

  console.log("Demo data created. Bet C (open) id:", c.id, "| Ido id:", u["Ido"]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
