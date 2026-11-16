import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(
  "C:/Users/Joshua Selvam/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-f315420e-af64-4f85-9d85-e09b06f1556c/files/media/demo-preview-design"
);
fs.mkdirSync(outDir, { recursive: true });

const widths = (process.env.WIDTHS || "1920,1680,1440").split(",").map(Number);
const country = process.env.COUNTRY || "MY";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let failed = false;
for (const width of widths) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((c) => localStorage.setItem("ordenz-country", c), country);
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".hero.cim-hero");
  await new Promise((r) => setTimeout(r, 800));

  const m = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el || getComputedStyle(el).display === "none") return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) };
    };
    const b = {
      brand: box(".hero-copy > .brand-row"),
      eyebrow: box(".hero-copy > .eyebrow"),
      title: box(".hero-copy > .hero-title"),
      lead: box(".hero-copy > .lead"),
      actions: box(".hero-copy > .actions"),
      reports: box(".hero-reports"),
      show: box(".hero-art .show"),
      strip: box(".hero-features-list"),
      rail: box(".hero-rail--features"),
    };
    const cardImgs = [...document.querySelectorAll(".hero-features-photo--card, .hero-rail-shot--product")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => ({ src: el.getAttribute("src"), loaded: el.complete && el.naturalWidth > 0 }));
    const issues = [];
    const near = (a, c, tol = 2) => Math.abs(a - c) <= tol;
    if (b.reports && b.show) {
      if (b.brand && !near(b.brand.y, b.show.y, 4)) issues.push("screen top not level with brand row");
      if (!near(b.reports.b, b.show.b)) issues.push("reports/screen bottoms differ");
      if (b.reports.r > b.show.x) issues.push("reports overlap screen");
      if (b.reports.h < 220) issues.push("reports panel too short (" + b.reports.h + "px)");
    }
    for (const k of ["title", "eyebrow", "lead", "actions"]) {
      if (b[k] && b.reports && !near(b[k].x, b.reports.x)) issues.push(k + " not on left column edge");
      if (b[k] && b.reports && b[k].r > b.reports.r + 2) issues.push(k + " wider than left column");
    }
    if (b.actions && b.reports && b.actions.b > b.reports.y) issues.push("copy runs into reports");
    if (b.strip && b.reports && b.show && (!near(b.strip.x, b.reports.x) || !near(b.strip.r, b.show.r))) issues.push("strip not spanning reports→preview");
    const railGap = b.rail && b.rail.w < 20 ? 6 : 12;
    if (b.rail && b.show && b.rail.x - b.show.r < railGap) issues.push("rail too close to preview");
    return { b, cardImgs, issues };
  });
  const missing = [];
  for (const { src } of m.cardImgs) {
    const res = await page.evaluate(async (s) => (await fetch(s)).status, src);
    if (res !== 200) missing.push(src);
  }
  if (missing.length) m.issues.push("card terminal image missing: " + missing.join(", "));

  const shot = path.join(outDir, `align-review-${width}.png`);
  await page.screenshot({ path: shot, clip: { x: 0, y: 0, width, height: Math.min(1000, (m.b.strip?.b || 1000) + 16) } });
  console.log(width, JSON.stringify({ issues: m.issues, b: m.b, cardImgs: m.cardImgs }));
  if (m.issues.length) failed = true;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
