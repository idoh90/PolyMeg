// Removes all bets/positions/notifications, keeping user accounts.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  await p.notification.deleteMany();
  await p.position.deleteMany();
  await p.option.deleteMany();
  await p.market.deleteMany();
  console.log("Cleared all bets. Accounts kept.");
  await p.$disconnect();
})();
