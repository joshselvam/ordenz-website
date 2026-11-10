/**
 * Put live tickets on the local demo cafe so Kitchen, Token screen and Guest
 * have something real to show before capture-spotlight.mjs runs.
 * Usage: node scripts/seed-spotlight-orders.mjs   (local docker app only)
 */
const APP = process.env.ORDENZ_APP_URL || "http://localhost:8080";
if (!/localhost|127\.0\.0\.1/.test(APP)) throw new Error("Seed only against a local app");

async function call(token, method, url, body) {
  const r = await fetch(APP + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${url} ${r.status}: ${JSON.stringify(j)}`);
  return j;
}

const MY = process.env.COUNTRY === "MY";
const owner = (await call(null, "POST", "/api/auth/login", { email: MY ? "owner+my@example.com" : "owner@example.com", password: "changeme123" })).token;
const menu = await call(owner, "GET", "/api/menu");
const items = (menu.items || []).filter((i) => i.active !== false && (i.can_make ?? 0) > 0);
const pick = (re) => {
  const hit = items.find((i) => re.test(i.name_en));
  if (!hit) throw new Error(`No in-stock menu item matches ${re}; each run serves its Ready tickets, so reset the demo with docker compose down -v`);
  return hit;
};
const plan = MY ? [
  { lines: [[/teh tarik/i, 2], [/roti canai/i, 1]], type: "dine", to: "ready" },
  { lines: [[/kopi o/i, 1]], type: "take", to: "preparing" },
  { lines: [[/nasi lemak/i, 1]], type: "dine", to: null },
] : [
  { lines: [[/latte/i, 2], [/croissant/i, 1]], type: "dine", to: "ready" },
  { lines: [[/filter kaapi/i, 1], [/brownie/i, 1]], type: "take", to: "ready" },
  { lines: [[/cappuccino/i, 1]], type: "take", to: "preparing" },
  { lines: [[/cold brew/i, 1], [/brownie/i, 1]], type: "dine", to: "preparing" },
  { lines: [[/espresso/i, 1]], type: "take", to: null },
  { lines: [[/mocha/i, 2]], type: "dine", to: null },
];
const open = await call(owner, "GET", "/api/orders");
const openOrders = (open.orders || open || []).filter((o) => ["new", "preparing", "ready"].includes(o.status));
// A served ticket keeps its stock deducted; cancelling a not-yet-ready one puts it back.
// Ready tickets are cooked, so the app only lets them be served.
for (const o of openOrders) {
  const status = o.status === "ready" ? "served" : "cancelled";
  await call(owner, "POST", `/api/orders/${o.id}/status`, { status }).catch((e) => console.error(`${status} ${o.id}: ${e.message}`));
}
const left = await call(owner, "GET", "/api/orders");
const stuck = (left.orders || left || []).filter((o) => ["new", "preparing", "ready"].includes(o.status));
if (stuck.length) throw new Error(`could not clear open tickets: ${stuck.map((o) => o.token ?? o.id).join(", ")}`);
const made = [];
for (const p of plan) {
  const r = await call(owner, "POST", "/api/orders", {
    source: "counter", orderType: p.type, paymentMethod: "cash",
    clientRef: `spot-${Date.now()}-${made.length}`,
    lines: p.lines.map(([re, qty]) => ({ itemId: pick(re).id, qty, addonIds: [] })),
  });
  const order = r.order || r;
  if (p.to === "preparing" || p.to === "ready") await call(owner, "POST", `/api/orders/${order.id}/status`, { status: "preparing" });
  if (p.to === "ready") await call(owner, "POST", `/api/orders/${order.id}/status`, { status: "ready" });
  made.push({ id: order.id, token: order.token, to: p.to || "new" });
}
const tab = await call(owner, "POST", "/api/orders", {
  source: "counter", orderType: "dine", paymentMethod: "open", clientRef: `spot-guest-${Date.now()}`,
  lines: (MY ? [[/teh tarik/i, 1], [/roti canai/i, 1]] : [[/latte/i, 1], [/croissant/i, 1]]).map(([re, qty]) => ({ itemId: pick(re).id, qty, addonIds: [] })),
});
const tabOrder = tab.order || tab;
await call(owner, "POST", "/api/guest-bill", { status: "open", orderId: tabOrder.id });
console.log(JSON.stringify({ made, guestBill: tabOrder.id }, null, 1));
