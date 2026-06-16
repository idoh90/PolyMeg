// End-to-end smoke test against the running dev server (http://localhost:3000).
// Drives the user's worked example through the real HTTP API + DB.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

const cookies = {}; // name -> cookie string
function jar(label) {
  return {
    get: () => cookies[label] ?? "",
    set: (res) => {
      const sc = res.headers.get("set-cookie");
      if (sc) cookies[label] = sc.split(";")[0];
    },
  };
}

async function login(label, userId, pin) {
  const j = jar(label);
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, pin }),
  });
  j.set(res);
  if (!res.ok) throw new Error(`login ${label} failed: ${await res.text()}`);
}

async function api(label, path, method, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: jar(label).get() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} (${label}) -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ✓ " + msg);
}

async function main() {
  // Clean slate (keep admin Ido).
  await prisma.notification.deleteMany();
  await prisma.position.deleteMany();
  await prisma.option.deleteMany();
  await prisma.market.deleteMany();
  await prisma.user.deleteMany({ where: { name: { in: ["Alice", "Bob"] } } });

  const ido = await prisma.user.findUnique({ where: { name: "Ido" } });
  if (!ido) throw new Error("Seed admin Ido first (npm run db:seed)");

  console.log("Login as admin Ido");
  await login("ido", ido.id, "1234");

  console.log("Create friends Alice & Bob");
  await api("ido", "/api/admin/users", "POST", { name: "Alice", pin: "1111" });
  await api("ido", "/api/admin/users", "POST", { name: "Bob", pin: "2222" });
  const alice = await prisma.user.findUnique({ where: { name: "Alice" } });
  const bob = await prisma.user.findUnique({ where: { name: "Bob" } });

  console.log("Create a Yes/No bet");
  const { id: marketId } = await api("ido", "/api/markets", "POST", {
    title: "Will we meet up this Friday?",
    criteria: "YES if 3+ of us are together before midnight.",
    minStake: 5,
    closesAt: new Date(Date.now() + 3600_000).toISOString(),
    options: ["Yes", "No"],
  });
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { options: true },
  });
  const yes = market.options.find((o) => o.label === "Yes");
  const no = market.options.find((o) => o.label === "No");

  console.log("Place positions: Ido 50→Yes, Alice 10→Yes, Bob 60→No");
  await api("ido", `/api/markets/${marketId}/positions`, "POST", { optionId: yes.id, amount: 50 });
  await login("alice", alice.id, "1111");
  await api("alice", `/api/markets/${marketId}/positions`, "POST", { optionId: yes.id, amount: 10 });
  await login("bob", bob.id, "2222");
  await api("bob", `/api/markets/${marketId}/positions`, "POST", { optionId: no.id, amount: 60 });

  console.log("Verify reject below-min stake");
  let rejected = false;
  try {
    await api("bob", `/api/markets/${marketId}/positions`, "POST", { optionId: no.id, amount: 2 });
  } catch {
    rejected = true;
  }
  assert(rejected, "stake below ₪5 minimum is rejected");

  // Simulate time passing so the bet can be resolved.
  await prisma.market.update({
    where: { id: marketId },
    data: { closesAt: new Date(Date.now() - 60_000) },
  });

  console.log("Resolve as creator: Yes won");
  await api("ido", `/api/markets/${marketId}/resolve`, "POST", { winningOptionId: yes.id });

  console.log("Check settlement page HTML");
  const html = await (
    await fetch(`${BASE}/settlement`, { headers: { Cookie: jar("ido").get() } })
  ).text();
  assert(html.includes("Bob") && html.includes("Ido") && html.includes("Alice"), "all three appear in settlement");
  assert(html.includes("₪50.00"), "a ₪50.00 transfer/standing shows (Bob→Ido)");
  assert(html.includes("₪10.00"), "a ₪10.00 transfer/standing shows (Bob→Alice)");
  // (positive standings render the sign as a separate text node, so only the
  //  amount is a literal substring; the exact +/- math is covered by unit tests)
  assert(html.includes("₪60.00"), "Bob's ₪60.00 standing shows");
  assert(html.includes("-₪60.00"), "Bob net is negative (-₪60.00)");

  console.log("\nALL E2E CHECKS PASSED ✅");
}

main()
  .catch((e) => {
    console.error("\nE2E FAILED ❌\n", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
