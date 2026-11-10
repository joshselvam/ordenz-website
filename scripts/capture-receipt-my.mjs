/**
 * Capture the Malaysia counter "Bill saved" receipt modal.
 * Output: scripts/_capture/receipt-my.png
 *         src/assets/img/receipt-my.webp  (with --write)
 *
 * Usage: node scripts/capture-receipt-my.mjs [--write]
 * Needs: local app on :8080, demomy owner owner+my@example.com / changeme123
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/Joshua Selvam/Documents/Mydoc/sample-project/DVibes/ordernest-pos/Ordernest-pos-AI/server/node_modules/playwright"
);

const APP = process.env.ORDENZ_APP_URL || "http://localhost:8080";
const EMAIL = "owner+my@example.com";
const PASS = "changeme123";
const WRITE = process.argv.includes("--write");
const rawDir = path.join(__dirname, "_capture");
const imgDir = path.join(__dirname, "..", "src", "assets", "img");

function toWebp(png, webp) {
  const r = spawnSync("python", ["-c",
    "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').resize((1440,810), Image.Resampling.LANCZOS).save(sys.argv[2], 'WEBP', quality=86, method=6)",
    png, webp], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.error?.message || "webp convert failed");
}

async function signIn(page) {
  await page.goto(APP + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate(async ({ url, email, pass }) => {
    const r = await fetch(`${url}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`login ${r.status}: ${JSON.stringify(j)}`);
    localStorage.setItem("ordernest.session", JSON.stringify(j));
    // Match other website MY shots (counter-my, guest-my): always light UI.
    localStorage.setItem("ordenz.theme", "light");
    document.documentElement.dataset.theme = "light";
  }, { url: APP, email: EMAIL, pass: PASS });
}

async function addItem(page, name) {
  const btn = page.locator(`button[data-citem]`).filter({ hasText: new RegExp(name, "i") }).first();
  await btn.waitFor({ state: "visible", timeout: 10000 });
  await btn.click();
  const add = page.locator("#oAdd");
  if (await add.waitFor({ state: "visible", timeout: 1500 }).then(() => true, () => false)) {
    await add.click();
  }
  await page.waitForTimeout(300);
}

await mkdir(rawDir, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || "chrome" });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  try { localStorage.setItem("ordenz.theme", "light"); } catch { /* ignore */ }
});

try {
  await signIn(page);
  await page.goto(APP + "/#counter", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("ordenz.theme", "light");
    document.documentElement.dataset.theme = "light";
    const btn = document.getElementById("themeBtn");
    if (btn) {
      btn.textContent = "Dark theme";
      btn.setAttribute("aria-pressed", "false");
    }
  });
  // If the app still painted dark, flip via the real theme control.
  const themeLabel = await page.locator("#themeBtn").textContent().catch(() => "");
  if (/Light theme/i.test(themeLabel || "")) {
    await page.locator("#themeBtn").click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1200);
  await page.locator("button[data-citem], #cPay, [data-cpay='cash']").first().waitFor({ timeout: 15000 });

  // Match the prior MY receipt layout: Teh Tarik + Espresso when available.
  for (const name of ["Teh Tarik", "Espresso"]) {
    const count = await page.locator(`button[data-citem]`).filter({ hasText: new RegExp(name, "i") }).count();
    if (!count) throw new Error(`Menu item not found: ${name}`);
    await addItem(page, name);
  }

  const cash = page.locator("[data-cpay='cash']").first();
  await cash.waitFor({ state: "visible", timeout: 8000 });
  await cash.click();

  // #layer can stay aria/visibility-hidden in Playwright while the modal content is painted.
  await page.getByRole("heading", { name: /Bill saved/i }).waitFor({ state: "attached", timeout: 15000 });
  await page.getByText(/SST\s*6%/i).first().waitFor({ state: "attached", timeout: 8000 });
  await page.getByText(/Service charge/i).first().waitFor({ state: "attached", timeout: 8000 });
  await page.waitForTimeout(800);

  const png = path.join(rawDir, "receipt-my.png");
  await page.screenshot({ path: png, type: "png" });
  console.log("captured", png);

  if (WRITE) {
    const webp = path.join(imgDir, "receipt-my.webp");
    toWebp(png, webp);
    console.log("wrote", webp);
  }
} catch (e) {
  console.error("FAILED", e.message);
  process.exitCode = 1;
} finally {
  await ctx.close();
  await browser.close();
}
