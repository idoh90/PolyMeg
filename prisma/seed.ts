import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Creates the first admin account so you can log in and add your friends from
// the in-app admin screen. Change ADMIN_NAME / ADMIN_PIN below or via env.
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Ido";
const ADMIN_PIN = process.env.ADMIN_PIN ?? "1234";

async function main() {
  const pinHash = await bcrypt.hash(ADMIN_PIN, 10);
  const admin = await prisma.user.upsert({
    where: { name: ADMIN_NAME },
    update: { isAdmin: true },
    create: { name: ADMIN_NAME, pinHash, isAdmin: true },
  });
  console.log(
    `Admin ready: "${admin.name}" (PIN ${ADMIN_PIN}). Log in, then add friends from the Admin screen.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
