import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seeds the full friend roster. Ido is the admin (PIN 1234); everyone else
// starts with the placeholder PIN 0000 — set real ones later from the in-app
// Admin screen. Idempotent: re-running won't duplicate or reset existing PINs.
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Ido";
const ADMIN_PIN = process.env.ADMIN_PIN ?? "1234";
const FRIENDS = ["Omri", "Elad", "Yanai", "Ofek", "Liad", "Eyal", "Ido 2"];

async function main() {
  const admin = await prisma.user.upsert({
    where: { name: ADMIN_NAME },
    update: { isAdmin: true },
    create: { name: ADMIN_NAME, pinHash: await bcrypt.hash(ADMIN_PIN, 10), isAdmin: true },
  });
  console.log(`Admin ready: "${admin.name}" (PIN ${ADMIN_PIN}).`);

  const friendHash = await bcrypt.hash("0000", 10);
  for (const name of FRIENDS) {
    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) {
      console.log(`- ${name} already exists, skipping.`);
      continue;
    }
    await prisma.user.create({ data: { name, pinHash: friendHash, isAdmin: false } });
    console.log(`- created ${name} (PIN 0000).`);
  }

  const total = await prisma.user.count();
  console.log(`Done. ${total} accounts in the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
