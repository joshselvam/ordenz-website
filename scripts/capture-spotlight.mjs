/**
 * Capture the spotlight screenshots from the local app (India demo cafe).
 * Writes PNGs to scripts/_capture/ first; review them, then run with --write
 * to convert to WebP under src/assets/img/.
 *
 * Usage: node scripts/capture-spotlight.mjs [--write]
 *        COUNTRY=MY for the Malaysia demo cafe; ONLY=counter,owner for a subset.
 *        Run seed-spotlight-orders.mjs first so Kitchen, Token and Guest have live tickets.
 * Needs: docker compose up  (localhost:8080, owner@example.com / changeme123,
 *        cafe code demo, device key demo-kiosk-key)
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appServer = process.env.ORDENZ_APP_DIR
  ? path.join(process.env.ORDENZ_APP_DIR, "server")
  : path.join(__dirname, "..", "..", "Ordernest-pos-AI", "server");
const { chromium } = createRequire(path.join(appServer, "package.json"))("playwright");
const rawDir = path.join(__dirname, "_capture");
const imgDir = path.join(__dirname, "..", "src", "assets", "img");
const APP = process.env.ORDENZ_APP_URL || "http://localhost:8080";
const WRITE = process.argv.includes("--write");
const MY = process.env.COUNTRY === "MY";
const CAFE = MY
  ? { email: "owner+my@example.com", slug: "demomy", key: "demo-kiosk-key-my", suffix: "-my" }
  : { email: "owner@example.com", slug: "demo", key: "demo-kiosk-key", suffix: "" };

const SHOTS = MY ? [
  { name: "owner", as: "owner", hash: "owner" },
  { name: "counter", as: "owner", hash: "counter" },
  { name: "accounting-export", as: "owner", hash: "reports", tab: "Accounting export" },
  { name: "outlets", as: "owner", hash: "reports", tab: "All outlets" },
  { name: "recipes", as: "owner", hash: "recipes" },
  { name: "showcase", as: "shoptv" },
  { name: "guest", as: "guest" },
] : [
  { name: "recipes", as: "owner", hash: "recipes" },
  { name: "kitchen", as: "owner", hash: "kitchen" },
  { name: "owner", as: "owner", hash: "owner" },
  { name: "counter", as: "owner", hash: "counter" },
  { name: "accounting-export", as: "owner", hash: "reports", tab: "Accounting export" },
  { name: "outlets", as: "owner", hash: "reports", tab: "All outlets" },
  { name: "team", as: "owner", hash: "crew" },
  { name: "token-screen", as: "board" },
  { name: "showcase", as: "shoptv" },
  { name: "guest", as: "guest" },
];

async function signIn(page, as) {
  await page.goto(APP + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate(async ({ url, as, cafe }) => {
    const owner = as === "owner";
    const r = await fetch(owner ? `${url}/api/auth/login` : `${url}/api/auth/device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(owner
        ? { email: cafe.email, password: "changeme123" }
        : { cafe: cafe.slug, key: cafe.key, mode: as, deviceId: `website-shot-${cafe.slug}-${as}` }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`${as} sign-in ${r.status}: ${JSON.stringify(j)}`);
    localStorage.setItem("ordernest.session", JSON.stringify(j));
  }, { url: APP, as, cafe: CAFE });
}

async function capture(browser, shot) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2, colorScheme: "light" });
  const page = await ctx.newPage();
  await signIn(page, shot.as);
  await page.goto(APP + "/" + (shot.hash ? `#${shot.hash}` : ""), { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  if (shot.tab) {
    await page.getByRole("button", { name: shot.tab }).or(page.getByRole("tab", { name: shot.tab })).first().click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  }
  if (shot.as === "guest") {
    const bill = page.locator(".customer-bill:not(.customer-token-screen)").first();
    if (!(await bill.waitFor({ state: "visible", timeout: 8000 }).then(() => true, () => false))) {
      await ctx.close();
      throw new Error("Guest shows no open bill; run seed-spotlight-orders.mjs first");
    }
  }
  const out = path.join(rawDir, `${shot.name}${CAFE.suffix}.png`);
  await page.screenshot({ path: out, type: "png" });
  await ctx.close();
  return out;
}

function toWebp(png, webp) {
  const r = spawnSync("python", ["-c",
    "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').resize((1440,810), Image.Resampling.LANCZOS).save(sys.argv[2], 'WEBP', quality=86, method=6)",
    png, webp], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
}

await mkdir(rawDir, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || "chrome" });
const only = (process.env.ONLY || "").split(",").filter(Boolean);
for (const shot of SHOTS.filter((s) => !only.length || only.includes(s.name))) {
  try {
    const png = await capture(browser, shot);
    console.log("captured", shot.name, png);
    if (WRITE) {
      toWebp(png, path.join(imgDir, `${shot.name}${CAFE.suffix}.webp`));
      console.log("wrote", `${shot.name}${CAFE.suffix}.webp`);
    }
  } catch (e) {
    console.error("FAILED", shot.name, e.message);
    process.exitCode = 1;
  }
}
await browser.close();
