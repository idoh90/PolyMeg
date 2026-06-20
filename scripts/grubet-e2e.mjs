// GRUbet end-to-end against the dev server (grubet schema). Verifies accounts,
// groups, join modes, scoping and isolation.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";
const jars = {};

function setCookie(label, res) {
  const sc = res.headers.get("set-cookie");
  if (sc) jars[label] = sc.split(";")[0];
}
async function api(label, path, method = "GET", body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect: "manual",
    headers: { "Content-Type": "application/json", Cookie: jars[label] || "" },
    body: body ? JSON.stringify(body) : undefined,
  });
  setCookie(label, res);
  const txt = await res.text();
  let json = null;
  try { json = JSON.parse(txt); } catch {}
  return { status: res.status, json, txt };
}
function ok(c, m) { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) { failed = true; } }
let failed = false;

async function signup(label, username) {
  const r = await api(label, "/api/auth/signup", "POST", { username, password: "pass123", displayName: username });
  ok(r.status === 200, `signup ${username}`);
}

async function main() {
  // clean test users/groups from prior runs
  await prisma.group.deleteMany({ where: { name: { startsWith: "E2E " } } });
  await prisma.user.deleteMany({ where: { username: { in: ["e2ea", "e2eb", "e2ec"] } } });

  await signup("A", "e2ea");
  await signup("B", "e2eb");
  await signup("C", "e2ec");

  // A creates a CODE group
  let r = await api("A", "/api/groups", "POST", { name: "E2E Open", joinMode: "CODE" });
  const g1 = r.json.id, code1 = r.json.code;
  ok(!!g1 && !!code1, `A created CODE group (code ${code1})`);

  // B joins by code
  r = await api("B", "/api/groups/join", "POST", { code: code1 });
  ok(r.json?.status === "ACTIVE", "B joined by code → ACTIVE");

  // non-member C blocked from group page
  r = await api("C", `/g/${g1}`, "GET");
  ok(r.status === 307 || r.status === 302, `non-member C blocked from /g (status ${r.status})`);

  // A creates a market in g1
  const closes = new Date(Date.now() + 2 * 86400000).toISOString();
  r = await api("A", "/api/markets", "POST", { groupId: g1, title: "E2E bet", minStake: 5, closesAt: closes, options: ["Yes", "No"] });
  const m1 = r.json.id;
  ok(!!m1, "A created market in group");

  // C (non-member) cannot bet in g1's market
  const opts = await prisma.option.findMany({ where: { marketId: m1 } });
  const yes = opts.find((o) => o.label === "Yes").id;
  r = await api("C", `/api/markets/${m1}/positions`, "POST", { optionId: yes, amount: 10 });
  ok(r.status === 403, `non-member C cannot bet (status ${r.status})`);

  // B places a bet
  r = await api("B", `/api/markets/${m1}/positions`, "POST", { optionId: yes, amount: 10 });
  ok(r.status === 200, "member B placed bet");

  // A resolves now (Yes)
  r = await api("A", `/api/markets/${m1}/resolve`, "POST", { mode: "now", winningOptionId: yes });
  ok(r.status === 200, "A resolved market");

  // second group is isolated: A makes E2E Two, no markets
  r = await api("A", "/api/groups", "POST", { name: "E2E Two", joinMode: "CODE" });
  const g2 = r.json.id;
  const m2count = await prisma.market.count({ where: { groupId: g2 } });
  ok(m2count === 0, "second group has no markets (isolation)");
  const m1count = await prisma.market.count({ where: { groupId: g1 } });
  ok(m1count === 1, "first group still has its market");

  // APPROVAL flow: A makes approval group, C requests, A approves
  r = await api("A", "/api/groups", "POST", { name: "E2E Appr", joinMode: "APPROVAL" });
  const g3 = r.json.id, code3 = r.json.code;
  r = await api("C", "/api/groups/join", "POST", { code: code3 });
  ok(r.json?.status === "PENDING", "C request → PENDING");
  r = await api("C", `/g/${g3}`, "GET");
  ok(r.status === 307 || r.status === 302, "pending C still blocked");
  const cId = (await prisma.user.findUnique({ where: { username: "e2ec" } })).id;
  r = await api("A", `/api/groups/${g3}/members`, "POST", { action: "approve", targetUserId: cId });
  ok(r.status === 200, "A approved C");
  const cm = await prisma.membership.findFirst({ where: { groupId: g3, userId: cId } });
  ok(cm?.status === "ACTIVE", "C now ACTIVE in approval group");

  console.log(failed ? "\nE2E FAILED ✗" : "\nALL E2E PASSED ✓");
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
