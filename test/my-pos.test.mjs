// Malaysia Google Ads LP at /my/pos/ — ring-up-a-bill redesign
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const cfg = JSON.parse(read("site.config.json"));

test("MY ads LP is ring-up-a-bill with honest claims and config prices only", () => {
  const h = read("src/my-pos.html");
  assert.match(h, /class="lp-my lp-ring"/);
  assert.match(h, /Ring up a bill/);
  assert.match(h, /brand-mark[^>]*>OrdenZ</);
  assert.match(h, /class="lp-hero-pill">PROMO · MALAYSIA</);
  assert.match(h, /lp-hero-pill[\s\S]{0,80}<h1>/);
  assert.doesNotMatch(h, /Cafe POS · Built for Malaysia/);
  assert.match(h, /\{\{priceStarterMy\}\}/);
  assert.match(h, /\{\{priceProMy\}\}/);
  assert.doesNotMatch(h, /RM97|RM197/);
  assert.match(h, /class="lp-trust"/);
  assert.match(h, /class="lp-trust-list"/);
  assert.doesNotMatch(h, /lp-dark-strip|lp-dark-list/);
  assert.match(h, /30-day Pro trial/);
  assert.match(h, /open with email/);
  assert.match(h, /first real bill/);
  assert.match(h, /day 15/);
  assert.match(h, /12 months for the price of 10/);
  assert.match(h, /1 paired device/);
  assert.match(h, /50 orders\/day/);
  assert.match(h, /Offline counter/);
  assert.match(h, /approved Fiuu/);
  assert.match(h, /SST 6%/);
  assert.match(h, /MyInvois files/);
  assert.match(h, /paid extra/);
  assert.match(h, /software list prices/);
  assert.match(h, /id="lpBill"/);
  assert.match(h, /id="lpDemoForm"/);
  assert.match(h, /id="demo-lead"/);
  // Demo card is a hero grid item (sibling of copy + bill), not nested inside the copy block.
  assert.match(h, /lp-hero-copy[\s\S]*?<\/div>\s*<div class="lp-demo-card" id="demo-lead">/);
  assert.match(h, /maxlength="40"/);
  assert.match(h, /id="price"/);
  assert.match(h, /id="faq"/);
  assert.match(h, /<details>/);
  assert.match(h, /lp-sticky/);
  assert.match(h, /languages your cafe (enables|turns on)/i);
  assert.doesNotMatch(h, /lp-promo|lp-price-row|lp-proof-stats|id="spotlight"|heroShow|promoVideo|ordenz-one-day|Open kiosk preview|Try the live demo|Eight screens|lp-why-strip|GrabFood/);
  // Old hero promo block (screenshot duplicate) must stay gone — trust strip + ring-up hero remain.
  assert.doesNotMatch(h, /30 days of Pro, free/);
  assert.doesNotMatch(h, /Then from \{\{priceStarterMy\}\} \/ month/);
  assert.doesNotMatch(h, /Software cafes run on tablets/);
  assert.doesNotMatch(h, /list prices\. Open with email/);
  assert.doesNotMatch(h, /LHDN e-Invoicing ready|20,?000\+ businesses|55% off|Google Places|4\.7 on Google|Trusted by \d/i);
  assert.doesNotMatch(h, /\bcheap\b|hardware theatre|no card|unlike StoreHub/i);
});

test("MY ads LP keeps at most eight convert CTAs and wires tracking hooks", () => {
  const h = read("src/my-pos.html");
  const startFree = (h.match(/Start free(?: trial)?/g) || []).length;
  assert.ok(startFree <= 6, `too many Start free labels: ${startFree}`);
  const convertish = [
    ...h.matchAll(/data-ads-conv="signup"/g),
    ...h.matchAll(/data-utm-wa/g),
    ...h.matchAll(/lp-demo-continue/g),
  ];
  assert.ok(convertish.length <= 12, "CTA wiring should stay lean");
  assert.match(h, /data-utm-pass/);
  assert.match(h, /lp-utm\.js/);
  assert.match(h, /lp-bill\.mjs/);
  assert.match(h, /lp-screens\.js/);
  assert.match(h, /ordenz-country","MY"/);
  assert.match(h, /wa\.me\/\{\{waNumberMY\}\}/);
  assert.match(h, /\{\{#if adsTagId\}\}/);
  assert.match(h, /lp-ads\.js/);
});

test("five-screen tabs use real MY screenshots without slideshow/video chrome", () => {
  const h = read("src/my-pos.html");
  assert.match(h, /id="lpScreens"/);
  assert.match(h, /role="tablist"/);
  for (const id of ["counter", "guest", "kiosk", "offline", "duitnow"]) {
    assert.match(h, new RegExp(`data-screen="${id}"`));
    assert.match(h, new RegExp(`id="panel-${id}"`));
  }
  assert.match(h, /counter-my\.webp/);
  assert.match(h, /guest-my\.webp/);
  assert.match(h, /kiosk-malay\.webp/);
  assert.match(h, /offline-my\.webp/);
  assert.match(h, /pay-duitnow-qr\.webp/);
  assert.ok(fs.existsSync(path.join(root, "src/assets/img/counter-my.webp")));
  assert.ok(fs.existsSync(path.join(root, "src/assets/lp-screens.js")));
});

test("lp-utm.js forces MY and keeps gclid/gbraid/wbraid + utm_* through CTAs and the demo form", () => {
  const j = read("src/assets/lp-utm.js");
  assert.match(j, /ordenz-country/);
  assert.match(j, /["']MY["']/);
  assert.match(j, /gclid/);
  assert.match(j, /gbraid/);
  assert.match(j, /wbraid/);
  assert.match(j, /utm_source/);
  assert.match(j, /sessionStorage/);
  assert.match(j, /type="hidden"|type='hidden'/);
  const waFn = j
    .slice(j.indexOf("function withWaText"), j.indexOf("var links"))
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(waFn, /gclid|gbraid|wbraid/);
  assert.match(waFn, /utm_campaign/);
  assert.doesNotMatch(j, /gtag|google-analytics|AW-|GTM-|facebook|pixel|places\.googleapis/i);
});

test("MY ads LP trust strip uses saffron pill-rail theme like homepage feature rail", () => {
  const c = read("src/assets/site.css");
  assert.match(c, /\.lp-trust-list\{[^}]*var\(--saffron\)/);
  assert.match(c, /\.lp-trust-list li\{[^}]*var\(--saffron-ink\)/);
  assert.match(c, /\.lp-trust-list\{[^}]*border-radius:999px/);
  assert.match(c, /\.lp-trust-list li\{[^}]*border-right:1px solid/);
  assert.doesNotMatch(c, /\.lp-dark-strip|\.lp-dark-list/);
});

test("MY ads LP uses a compact promo layout and shows no developer notes", () => {
  const c = read("src/assets/site.css");
  assert.match(c, /\.lp-my \.wrap,\.lp-top \.wrap\{max-width:1200px\}/);
  assert.doesNotMatch(c, /\.lp-hero-ring\{[^}]*min-height/);
  assert.match(c, /\.lp-hero-inner\{[^}]*grid-template-areas:"copy bill" "demo bill"/);
  assert.match(c, /\.lp-hero-inner\{[^}]*max-width:1200px/);
  assert.match(c, /\.lp-trust-list li\{[^}]*flex:1 1 0/);
  const h = read("src/my-pos.html");
  assert.doesNotMatch(h, /textContent|hardcoded|site config|invented/i);
});

test("build registers /my/pos/ ring-up meta and list prices from site.config", () => {
  const b = read("build.mjs");
  assert.match(b, /my-pos\.html/);
  assert.match(b, /my\/pos\/index\.html/);
  assert.match(b, /Ring up a bill/);
  assert.match(b, /priceStarterMy/);
  assert.match(b, /priceProMy/);
  assert.match(b, /adsTagId/);
  assert.equal(cfg.pricing.MY.monthly.starter, 97);
  assert.equal(cfg.pricing.MY.monthly.pro, 197);
  assert.equal(cfg.adsTagId, "");
});

test("built /my/pos/ page, sitemap, robots, security headers and assets stay consistent", () => {
  const r = spawnSync(process.execPath, ["build.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const page = read("dist/my/pos/index.html");
  assert.match(page, /<title>Cafe POS Malaysia \| Ring up a bill \| OrdenZ<\/title>/);
  assert.match(page, /rel="canonical" href="https:\/\/www\.ordenz\.com\/my\/pos\/"/);
  assert.match(page, /Ring up a bill/);
  assert.match(page, /RM97/);
  assert.match(page, /RM197/);
  assert.match(page, /id="lpBill"/);
  assert.match(page, /id="faq"/);
  assert.match(page, /FAQPage|Question/);
  assert.doesNotMatch(page, /heroShow|promoVideo|lp-promo|spotlight/i);
  assert.doesNotMatch(page, /30 days of Pro, free/);
  assert.doesNotMatch(page, /Then from RM97 \/ month/);
  assert.doesNotMatch(page, /Software cafes run on tablets/);
  assert.doesNotMatch(page, /Starter RM97 · Pro RM197 list prices\. Open with email/);
  assert.doesNotMatch(page, /lp-ads\.js|googletagmanager/);
  assert.match(page, /href="https:\/\/app\.ordenz\.com"/);
  assert.match(page, /wa\.me\/601116441186/);
  const headers = read("dist/_headers");
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Strict-Transport-Security:/);
  assert.match(headers, /Permissions-Policy:/);
  assert.doesNotMatch(headers, /googletagmanager\.com/);
  const map = read("dist/sitemap.xml");
  assert.match(map, /https:\/\/www\.ordenz\.com\/my\/pos\//);
  assert.match(read("dist/robots.txt"), /Sitemap: https:\/\/www\.ordenz\.com\/sitemap\.xml/);
  assert.match(read("dist/_redirects"), /\/my\/pos\s+\/my\/pos\/\s+301/);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/lp-utm.js")));
  assert.ok(fs.existsSync(path.join(root, "dist/assets/lp-bill.mjs")));
  assert.ok(fs.existsSync(path.join(root, "dist/assets/lp-screens.js")));
  assert.ok(fs.existsSync(path.join(root, "dist/assets/lp-ads.js")));
});
