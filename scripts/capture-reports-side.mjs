import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(
  process.env.CAPTURE_OUT ||
    "C:/Users/Joshua Selvam/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-f315420e-af64-4f85-9d85-e09b06f1556c/files/media/demo-preview-design"
);
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 1 },
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector(".hero-reports", { timeout: 15000 });
await new Promise((r) => setTimeout(r, 1200));

const metrics = await page.evaluate(() => {
  const reports = document.querySelector(".hero-reports");
  const preview = document.querySelector(".hero-preview");
  const side = document.querySelector(".hero-side");
  const art = document.querySelector(".hero-art");
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  const rb = box(reports);
  const pb = box(preview);
  let overlap = false;
  if (rb && pb) {
    overlap = !(rb.x + rb.w <= pb.x || pb.x + pb.w <= rb.x || rb.y + rb.h <= pb.y || pb.y + pb.h <= rb.y);
  }
  return {
    side: box(side),
    reports: rb,
    preview: pb,
    art: box(art),
    overlap,
    reportsParent: reports?.parentElement?.className || null,
  };
});

const hero = await page.$(".hero.cim-hero");
const fullPath = path.join(outDir, "reports-left-300x692-verify.png");
if (hero) await hero.screenshot({ path: fullPath });
else await page.screenshot({ path: fullPath, fullPage: false });

const reportsEl = await page.$(".hero-reports");
const reportsPath = path.join(outDir, "reports-panel-300x692.png");
if (reportsEl) await reportsEl.screenshot({ path: reportsPath });

console.log(JSON.stringify({ metrics, fullPath, reportsPath }, null, 2));
await browser.close();
if (metrics.overlap) process.exit(2);
if (!metrics.reports || Math.abs(metrics.reports.w - 300) > 8 || Math.abs(metrics.reports.h - 692) > 20) {
  console.error("reports size not ~300x692", metrics.reports);
  process.exit(3);
}
