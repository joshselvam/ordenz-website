/**
 * Capture a proper OrdenZ DuitNow kiosk pay screenshot for the MY ads LP.
 * Writes scripts/_capture/pay-duitnow-qr.png then (with --write) webp assets.
 *
 * Usage: node scripts/capture-duitnow-pay.mjs [--write]
 * Needs: site served at http://127.0.0.1:4173 (or ORDENZ_SITE_URL)
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require("./../node_modules/playwright");
const rawDir = path.join(__dirname, "_capture");
const imgDir = path.join(__dirname, "..", "src", "assets", "img");
const SITE = process.env.ORDENZ_SITE_URL || "http://127.0.0.1:4173";
const WRITE = process.argv.includes("--write");

async function capture(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 810 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("ordenz-country", "MY");
      localStorage.setItem("ordenz.theme", "light");
    } catch (_) {}
  });
  await page.goto(`${SITE}/demo/preview/#kiosk`, { waitUntil: "networkidle" });
  await page.waitForSelector("#kStart, .k-attract", { timeout: 8000 });
  await page.waitForTimeout(400);

  // Attract → dine-in
  await page.locator("#kStart, .k-attract").first().click();
  await page.waitForSelector("button[data-type='dine']", { timeout: 8000 });
  await page.locator("button[data-type='dine']").click();
  await page.waitForSelector("button.tile", { timeout: 8000 });
  await page.waitForTimeout(300);

  // Filter Kaapi has no required option groups — one click adds it.
  const kaapi = page.locator("button.tile").filter({ hasText: /Filter Kaapi|Filter/i }).first();
  if (await kaapi.count()) await kaapi.click();
  else await page.locator("button.tile:not(.soldout)").first().click();
  await page.waitForTimeout(400);

  // Option modal if present
  const addBtn = page.locator("#mAdd");
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(300);
  }

  // Review → DuitNow (dismiss upsell if it appears)
  await page.locator("#kReview").click({ timeout: 8000 });
  await page.waitForTimeout(400);
  const noThanks = page.locator("button:has-text('No thanks'), button:has-text('Skip'), [data-close]").first();
  if (await noThanks.isVisible().catch(() => false)) {
    await noThanks.click().catch(() => {});
    await page.waitForTimeout(250);
    // May need Review again after upsell skip
    if (await page.locator("#kReview").isVisible().catch(() => false)) {
      await page.locator("#kReview").click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }
  await page.locator("#kUpi").click({ timeout: 8000 });
  await page.waitForSelector(".paycard canvas#qr, .k-pay .paycard", { timeout: 8000 });
  await page.waitForTimeout(400);

  // Match real-app chrome (upi.webp pattern): Pay with DuitNow, cafe · Bill N, Cancel order.
  await page.evaluate(() => {
    document.body.classList.add("kiosk-only");
    document.querySelectorAll("nav, .tabs, .sample-notice, #helpBtn, #resetBtn, #kioskMode, .toast, [role='status']").forEach((el) => {
      el.style.display = "none";
    });
    const head = document.querySelector(".k-head h2");
    if (head) head.textContent = "Pay with DuitNow";
    const muted = [...document.querySelectorAll(".paycard div, .paycard p")].find((el) => /demo QR|OrdenZ Demo/i.test(el.textContent || ""));
    if (muted) muted.textContent = "OrdenZ Demo · Bill 42";
    const sim = document.getElementById("kSim");
    if (sim) sim.remove();
    const back = document.getElementById("kPayBack");
    if (back) back.textContent = "Cancel order";
    const prog = document.querySelector(".paycard .progress");
    if (prog) prog.remove();
    const msg = document.getElementById("payMsg");
    if (msg) msg.textContent = "Waiting for payment…";
  });
  // Enlarge the paycard so the LP 16:9 crop is not mostly cream whitespace.
  await page.addStyleTag({
    content: `
      .k-pay { padding: 8px 16px !important; }
      .paycard { width: min(540px, 94vw) !important; transform: scale(1.18); transform-origin: center top; }
      .k-head { padding: 14px 22px !important; }
    `,
  });
  await page.waitForTimeout(250);

  const out = path.join(rawDir, "pay-duitnow-qr.png");
  const kioskOut = path.join(rawDir, "pay-duitnow-kiosk.png");
  const kiosk = page.locator(".kiosk").first();
  if (await kiosk.count()) await kiosk.screenshot({ path: kioskOut, type: "png" });
  await page.screenshot({ path: out, type: "png" });
  await ctx.close();
  return { full: out, kiosk: kioskOut };
}

function toWebpFull(png, webp) {
  // Prefer a kiosk-only shot composed onto cream so the paycard fills the LP card.
  const r = spawnSync(
    "python",
    [
      "-c",
      `import sys
from PIL import Image
src = Image.open(sys.argv[1]).convert('RGB')
OUT=(1440,810); CREAM=(255,252,245)
out=Image.new('RGB', OUT, CREAM)
scale=min((OUT[0]-64)/src.width, (OUT[1]-32)/src.height)
nw,nh=max(1,int(src.width*scale)), max(1,int(src.height*scale))
src=src.resize((nw,nh), Image.Resampling.LANCZOS)
out.paste(src, ((OUT[0]-nw)//2, (OUT[1]-nh)//2))
out.save(sys.argv[2], 'WEBP', quality=86, method=6)
print('full', out.size, 'from', nw, nh)`,
      png,
      webp,
    ],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  console.log((r.stdout || "").trim());
}

function toWebpRail(png, webp) {
  // Landscape rail: left title + amount, right QR (mirrors pay-upi-qr-rail).
  const py = `
import sys
from PIL import Image, ImageDraw, ImageFont
src = Image.open(sys.argv[1]).convert("RGB")
w, h = src.size
px = src.load()
bg = src.getpixel((10, 10))
xs, ys = [], []
for y in range(0, h, 3):
  for x in range(0, w, 3):
    p = px[x, y]
    if max(abs(p[i]-bg[i]) for i in range(3)) > 28:
      xs.append(x); ys.append(y)
box = (max(0,min(xs)-8), max(0,min(ys)-8), min(w,max(xs)+8), min(h,max(ys)+8)) if xs else (0,0,w,h)
card = src.crop(box)
cw, ch = card.size

def content_box(im, tol=22):
  p = im.load(); W,H = im.size; xs,ys=[],[]
  bg0 = im.getpixel((2,2))
  for y in range(0,H,2):
    for x in range(0,W,2):
      pix = p[x,y]
      if max(abs(pix[i]-bg0[i]) for i in range(3)) > tol:
        xs.append(x); ys.append(y)
  if not xs: return (0,0,W,H)
  return (min(xs), min(ys), max(xs)+1, max(ys)+1)

SIZE = (420, 236)
CREAM = (255, 252, 245)
rail = Image.new("RGB", SIZE, CREAM)
qside = 188
# QR band: upper half of paycard (label + QR), then trim to the black QR square
qr_band = card.crop((0, int(ch*0.08), cw, int(ch*0.55)))
qr = qr_band.crop(content_box(qr_band, 40))
# Prefer the darkest square (the QR itself)
side = min(qr.size)
qr = qr.crop(((qr.width-side)//2, (qr.height-side)//2, (qr.width+side)//2, (qr.height+side)//2))
qr = qr.resize((qside, qside), Image.Resampling.LANCZOS)
rail.paste(qr, (SIZE[0]-qside-14, (SIZE[1]-qside)//2))

draw = ImageDraw.Draw(rail)
try:
  font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 30)
  font2 = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 14)
  fontAmt = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 36)
except Exception:
  font = ImageFont.load_default(); font2 = font; fontAmt = font
draw.text((16, 36), "DuitNow", fill=(20,33,28), font=font)
draw.text((16, 76), "Ask the customer to scan and pay", fill=(118,133,126), font=font2)
# Amount from paycard text (RM …)
draw.text((16, 130), "RM 3.51", fill=(20,33,28), font=fontAmt)
rail.save(sys.argv[2], "WEBP", quality=86, method=6)
print("rail", rail.size)
`;
  const r = spawnSync("python", ["-c", py, png, webp], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  console.log(r.stdout.trim());
}

await mkdir(rawDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
let shots;
try {
  shots = await capture(browser);
  console.log("captured", shots);
} finally {
  await browser.close();
}

if (WRITE) {
  const full = path.join(imgDir, "pay-duitnow-qr.webp");
  const rail = path.join(imgDir, "pay-duitnow-qr-rail.webp");
  const sourceForFull = shots.kiosk || shots.full;
  toWebpFull(sourceForFull, full);
  toWebpRail(shots.full, rail);
  console.log("wrote", full);
  console.log("wrote", rail);
} else {
  console.log("Review", shots, "then re-run with --write");
}
