import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const outDir = path.resolve("demo-preview-design");
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"]
});

async function shot(country, file) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 980, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate((c) => {
    localStorage.setItem("ordenz-country", c);
    localStorage.setItem("ordenz.theme", "dark");
  }, country);
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".hero-preview-frame");
  await page.waitForSelector(".hero-features-list");
  await page.evaluate(() => {
    const btn = document.querySelector('.show-dot[data-scene="counter"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 2500));
  const out = path.join(outDir, file);
  await page.screenshot({ path: out, type: "jpeg", quality: 85 });
  console.log("wrote", out, "country", country);
  await page.close();
}

await shot("MY", "impl-verify-my.jpg");
await shot("IN", "impl-verify-in.jpg");
await browser.close();
