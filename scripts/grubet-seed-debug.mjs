// Seeds debug accounts into the grubet schema so the quick-login picker (0000)
// and the admin shortcut (1234) have real users. Idempotent: upserts by username.
// These accounts have unusable random passwords — they're meant for the debug
// backdoor (/api/auth/debug), not password login.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const ADMIN = { username: "ido", displayName: "Ido" };
const FRIENDS = [
  { username: "omri", displayName: "Omri" },
  { username: "elad", displayName: "Elad" },
  { username: "yanai", displayName: "Yanai" },
  { username: "ofek", displayName: "Ofek" },
  { username: "liad", displayName: "Liad" },
  { username: "eyal", displayName: "Eyal" },
  { username: "ido2", displayName: "Ido 2" },
];

async function ensure({ username, displayName }) {
  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  const u = await prisma.user.upsert({
    where: { username },
    update: { displayName },
    create: { username, displayName, passwordHash },
  });
  return u;
}

async function main() {
  const admin = await ensure(ADMIN);
  console.log(`admin ready: @${admin.username} (${admin.displayName})`);
  for (const f of FRIENDS) {
    const u = await ensure(f);
    console.log(`- @${u.username} (${u.displayName})`);
  }
  const total = await prisma.user.count();
  console.log(`total users in grubet: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
