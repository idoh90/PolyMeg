// One-off cross-database copy: SRC_URL -> DST_URL (preserves ids, timestamps,
// and relations). Copies tables in FK-safe order. Idempotent (skipDuplicates).
import { PrismaClient } from "@prisma/client";

const src = new PrismaClient({ datasourceUrl: process.env.SRC_URL });
const dst = new PrismaClient({ datasourceUrl: process.env.DST_URL });

async function copy(model) {
  const rows = await src[model].findMany();
  if (rows.length) await dst[model].createMany({ data: rows, skipDuplicates: true });
  console.log(`${model}: copied ${rows.length}`);
}

async function main() {
  // Order matters: parents before children (FK constraints).
  await copy("user");
  await copy("market");
  await copy("option");
  await copy("position");
  await copy("notification");

  console.log("--- destination counts ---");
  for (const m of ["user", "market", "option", "position", "notification"]) {
    console.log(`${m} = ${await dst[m].count()}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await src.$disconnect();
    await dst.$disconnect();
  });
