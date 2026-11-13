/**
 * Capture Malaysia cash-drawer and offline-billing screenshots.
 * Output: src/assets/img/cash-drawer-my.webp  (1440×810)
 *         src/assets/img/offline-my.webp       (1440×810)
 *
 * Usage: node scripts/capture-cash-drawer-offline-my.mjs
 * Needs: docker compose up  (localhost:8080, owner+my@example.com / changeme123)
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/Joshua Selvam/Documents/Mydoc/sample-project/DVibes/ordernest-pos/Ordernest-pos-AI/server/node_modules/playwright"
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "src", "assets", "img");
const APP = process.env.ORDENZ_APP_URL || "http://localhost:8080";
const EMAIL = "owner+my@example.com";
const PASS = "changeme123";

function toWebp(pngPath, webpPath) {
  const m = spawnSync("magick", [pngPath, "-quality", "82", webpPath], { encoding: "utf8" });
  if (m.status === 0) return webpPath;
  const c = spawnSync("cwebp", ["-q", "82", pngPath, "-o", webpPath], { encoding: "utf8" });
  if (c.status === 0) return webpPath;
  throw new Error(`webp failed: ${m.stderr || m.error?.message} / ${c.stderr || c.error?.message}`);
}

async function loginViaLocalStorage(page) {
  // POST login via fetch in browser so session is set
  const session = await page.evaluate(
    async ({ url, email, pass }) => {
      const r = await fetch(`${url}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(`login ${r.status}: ${JSON.stringify(j)}`);
      localStorage.setItem("ordernest.session", JSON.stringify(j));
      return j;
    },
    { url: APP, email: EMAIL, pass: PASS }
  );
  return session;
}

async function captureCashDrawer(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 810 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const page = await ctx.newPage();

  // Land on app root to seed session storage
  await page.goto(APP + "/", { waitUntil: "domcontentloaded" });
  await loginViaLocalStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Navigate to Cash drawer
  const drawerBtn = page.locator('[data-go="shifts"], button:has-text("Cash drawer"), a:has-text("Cash drawer")').first();
  if (await drawerBtn.count()) {
    await drawerBtn.click({ timeout: 8000 });
  } else {
    // Try hash navigation
    await page.goto(APP + "/#shifts", { waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(1200);

  // Wait for the expected-cash figure or shift section to render
  await page.locator("#shiftsView, #cashDrawerView, h2:has-text('Cash drawer'), h1:has-text('Cash drawer'), .shift-header, #floatRow").first()
    .waitFor({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);

  const tmpPng = path.join(outDir, "_tmp-cash-drawer-my.png");
  await page.screenshot({ path: tmpPng, type: "png" });
  await ctx.close();
  return tmpPng;
}

async function captureOffline(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 810 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    // Note: Playwright context offline mode – start connected so login works, then go offline
  });
  const page = await ctx.newPage();

  await page.goto(APP + "/", { waitUntil: "domcontentloaded" });
  const session = await loginViaLocalStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Go to counter
  const counterBtn = page.locator('[data-go="counter"], a:has-text("Counter")').first();
  if (await counterBtn.count()) {
    await counterBtn.click({ timeout: 8000 });
  } else {
    await page.goto(APP + "/#counter", { waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(1200);

  // Add an item to cart so "Save offline" or "Offline bill" UI becomes relevant
  const menuItem = page.locator(".menu-item button, .item-add, button.add, .item button").first();
  if (await menuItem.count()) {
    await menuItem.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // Simulate offline: cut the network for the context
  await ctx.setOffline(true);
  await page.waitForTimeout(300);

  // Try to bill / checkout — this should trigger the "Save offline" path
  const billBtn = page.locator('button:has-text("Bill"), button:has-text("Save"), button:has-text("Next bill"), button[data-action="bill"]').first();
  if (await billBtn.count()) {
    await billBtn.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(600);
  }

  // Wait for the offline confirmation / saved-offline banner or dialog
  await page.locator('text=/Saved offline|OFF-|offline/i').first().waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  const tmpPng = path.join(outDir, "_tmp-offline-my.png");
  await page.screenshot({ path: tmpPng, type: "png" });

  // Restore network
  await ctx.setOffline(false);
  await ctx.close();
  return tmpPng;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PW_CHANNEL || "chrome",
  });

  let cashPng, offlinePng;

  console.log("Capturing cash-drawer-my...");
  cashPng = await captureCashDrawer(browser);
  console.log("cash drawer png:", cashPng);

  console.log("Capturing offline-my...");
  offlinePng = await captureOffline(browser);
  console.log("offline png:", offlinePng);

  await browser.close();

  // Convert to webp
  for (const [src, dest] of [
    [cashPng, path.join(outDir, "cash-drawer-my.webp")],
    [offlinePng, path.join(outDir, "offline-my.webp")],
  ]) {
    try {
      toWebp(src, dest);
      console.log("webp:", dest);
    } catch (e) {
      // Fallback: copy PNG as webp (browsers accept PNG bytes if src ends .webp is not ideal,
      // but better than a missing asset; also keep the PNG next to it)
      const pngDest = dest.replace(/\.webp$/, ".png");
      await writeFile(pngDest, await import("node:fs").then(m => m.promises.readFile(src)));
      await writeFile(dest, await import("node:fs").then(m => m.promises.readFile(src)));
      console.warn("webp fallback (png copy):", pngDest, e.message);
    }
  }

  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
