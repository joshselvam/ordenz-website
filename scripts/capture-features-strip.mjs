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
  defaultViewport: { width: 1680, height: 960, deviceScaleFactor: 1 },
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector(".hero-features-list", { timeout: 15000 });
await new Promise((r) => setTimeout(r, 800));

const metrics = await page.evaluate(() => {
  const el = document.querySelector(".hero-features-list");
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    w: Math.round(r.width),
    h: Math.round(r.height),
    bg: cs.backgroundColor,
    color: cs.color,
    itemCount: el.querySelectorAll("li").length,
  };
});

const stripPath = path.join(outDir, "features-strip-saffron-verify.png");
const el = await page.$(".hero-features-list");
if (el) await el.screenshot({ path: stripPath });

console.log(JSON.stringify({ metrics, stripPath }, null, 2));
await browser.close();

const bg = metrics.bg.replace(/\s/g, "");
// expect saffron-ish rgb around 240,177,61
if (!/rgb\((\d+),(\d+),(\d+)\)/.test(bg)) {
  console.error("unexpected bg", metrics.bg);
  process.exit(2);
}
const [, rr, gg, bb] = bg.match(/rgb\((\d+),(\d+),(\d+)\)/).map(Number);
if (rr < 200 || gg < 140 || bb > 120) {
  console.error("bg not saffron-like", metrics.bg);
  process.exit(3);
}
