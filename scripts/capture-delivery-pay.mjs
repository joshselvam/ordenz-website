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
  defaultViewport: { width: 1680, height: 960, deviceScaleFactor: 1 },
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector(".hero-features-list", { timeout: 15000 });

async function shotCountry(code, name) {
  await page.select("#country", code).catch(() => {});
  await page.evaluate((c) => {
    document.documentElement.setAttribute("data-country", c);
    localStorage.setItem("ordenz.country", c);
  }, code);
  await new Promise((r) => setTimeout(r, 400));
  const el = await page.$(".hero-features-list");
  const p = path.join(outDir, name);
  if (el) await el.screenshot({ path: p });
  return p;
}

const my = await shotCountry("MY", "strip-delivery-pay-my.png");
const inn = await shotCountry("IN", "strip-delivery-pay-in.png");
const check = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll(".hero-features-list img")]
    .filter((i) => getComputedStyle(i).display !== "none")
    .map((i) => i.getAttribute("src"));
  return imgs;
});
console.log(JSON.stringify({ my, inn, visibleImgs: check }, null, 2));
await browser.close();
