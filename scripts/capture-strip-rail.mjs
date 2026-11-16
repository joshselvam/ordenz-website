import puppeteer from "puppeteer-core";
import path from "node:path";

const outDir = "C:/Users/Joshua Selvam/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-f315420e-af64-4f85-9d85-e09b06f1556c/files/media/demo-preview-design";
const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new" });
for (const country of ["MY", "IN"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1300 });
  await page.evaluateOnNewDocument((c) => localStorage.setItem("ordenz-country", c), country);
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle0" });
  const strip = await page.$(".hero-features-list");
  const overflow = await page.evaluate((el) => el.scrollWidth - el.clientWidth, strip);
  await strip.screenshot({ path: path.join(outDir, `strip-${country}.png`) });
  // Lay the rail cards out flat so every card can be checked in one image.
  await page.addStyleTag({ content: ".hero-rail-features{animation:none!important;display:grid!important;grid-template-columns:repeat(6,210px);gap:8px;position:static!important;transform:none!important}.hero-rail-features>li:nth-child(n+12){display:none!important}.hero-rail,.hero-rail-glass,.hero-rail-stream{position:static!important;width:auto!important;height:auto!important;max-height:none!important;overflow:visible!important}" });
  await page.evaluate(() => document.querySelectorAll(".hero-rail-shot").forEach((i) => (i.loading = "eager")));
  await new Promise((r) => setTimeout(r, 1500));
  const rail = await page.$(".hero-rail-features");
  await rail.screenshot({ path: path.join(outDir, `rail-cards-${country}.png`) });
  console.log(country, "strip overflow px:", overflow);
  await page.close();
}
await browser.close();
