import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const storeMedia = path.resolve(
  "C:/Users/Joshua Selvam/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-f315420e-af64-4f85-9d85-e09b06f1556c/files/media/demo-preview-design"
);
fs.mkdirSync(storeMedia, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"]
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 980, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => {
  localStorage.setItem("ordenz-country", "IN");
  localStorage.setItem("ordenz.theme", "dark");
});
await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector(".hero-art.has-video .show");
await page.evaluate(() => {
  const btn = document.querySelector('.show-dot[data-scene="guest"]');
  if (btn) btn.click();
});
await new Promise((r) => setTimeout(r, 1200));

const box = await page.$eval(".hero-art.has-video .show", (el) => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
});
console.log("show box", JSON.stringify(box));

const out = path.join(storeMedia, "impl-verify-guest-922x804.jpg");
await page.screenshot({
  path: out,
  type: "jpeg",
  quality: 88,
  clip: {
    x: box.x,
    y: box.y,
    width: Math.min(box.width, 922),
    height: Math.min(box.height, 804)
  }
});
console.log("wrote", out);

await page.screenshot({
  path: path.join(storeMedia, "align-preview-922x804.jpg"),
  type: "jpeg",
  quality: 88
});
console.log("wrote align-preview-922x804.jpg");
await browser.close();
