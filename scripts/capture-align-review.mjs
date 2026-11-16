import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(
  "C:/Users/Joshua Selvam/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-f315420e-af64-4f85-9d85-e09b06f1556c/files/media/demo-preview-design"
);
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  defaultViewport: { width: 1680, height: 1100, deviceScaleFactor: 1 },
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector(".hero.cim-hero", { timeout: 15000 });
await new Promise((r) => setTimeout(r, 1000));

const metrics = await page.evaluate(() => {
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right) };
  };
  const side = document.querySelector(".hero-side");
  const copy = document.querySelector(".hero-copy");
  const reports = document.querySelector(".hero-reports");
  const art = document.querySelector(".hero-art");
  const show = document.querySelector(".hero-art .show");
  const strip = document.querySelector(".hero-features-list");
  const rail = document.querySelector(".hero-rail--features");
  const wrap = document.querySelector(".hero.cim-hero .wrap");
  const items = [...document.querySelectorAll(".hero-features-list li")].map((li) => {
    const r = li.getBoundingClientRect();
    const label = (li.innerText || "").replace(/\s+/g, " ").trim();
    return { label, x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) };
  });
  const sb = box(side);
  const ab = box(art);
  const rb = box(reports);
  const pb = box(document.querySelector(".hero-preview"));
  let overlap = false;
  if (rb && pb) {
    overlap = !(rb.x + rb.w <= pb.x || pb.x + pb.w <= rb.x || rb.y + rb.h <= pb.y || pb.y + pb.h <= rb.y);
  }
  return {
    wrap: box(wrap),
    side: sb,
    copy: box(copy),
    reports: rb,
    art: ab,
    show: box(show),
    preview: pb,
    strip: box(strip),
    rail: box(rail),
    overlap,
    sideVsArtBottomDelta: sb && ab ? sb.bottom - ab.bottom : null,
    stripItems: items,
    issues: [
      sb && ab && Math.abs(sb.x + sb.w + 16 - ab.x) > 24 ? "side/art column gap uneven" : null,
      sb && ab && sb.bottom - ab.bottom > 120 ? "left column much taller than preview" : null,
      rb && pb && overlap ? "reports overlap preview" : null,
      items.some((i) => i.w < 70) ? "strip cells too narrow" : null,
      items.some((i) => i.h > 90) ? "strip cells uneven height / wrapping" : null,
    ].filter(Boolean),
  };
});

const heroPath = path.join(outDir, "align-review-hero.png");
const stripPath = path.join(outDir, "align-review-strip.png");
const hero = await page.$(".hero.cim-hero");
if (hero) await hero.screenshot({ path: heroPath });
const strip = await page.$(".hero-features-list");
if (strip) await strip.screenshot({ path: stripPath });

console.log(JSON.stringify({ metrics, heroPath, stripPath }, null, 2));
await browser.close();
