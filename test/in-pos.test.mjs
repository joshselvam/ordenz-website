import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("India Ads LP source locks IN country and uses India WhatsApp", () => {
  const h = read("src/in-pos.html");
  assert.match(h, /ordenz-country","IN"/);
  assert.match(h, /dataset\.country="IN"/);
  assert.match(h, /PROMO · INDIA/);
  assert.match(h, /Ring up a bill/);
  assert.match(h, /Tap to bill/);
  assert.match(h, /\{\{priceStarterIn\}\}/);
  assert.match(h, /\{\{priceProIn\}\}/);
  assert.match(h, /wa\.me\/\{\{waNumberIN\}\}/);
  assert.match(h, /lp-bill-in\.mjs/);
  assert.match(h, /pay-upi-qr\.webp/);
  assert.match(h, /Toggle GST/);
  assert.doesNotMatch(h, /DuitNow|SST 6%|MyInvois|waNumberMY|priceStarterMy/);
  assert.match(h, /\{\{legalNameIn\}\}/);
  assert.match(h, /\{\{legalNoteIn\}\}/);
});

test("India Ads LP FAQ stays honest on GSTIN and company status", () => {
  const h = read("src/in-pos.html");
  assert.match(h, /GSTIN/);
  assert.match(h, /5% for most cafes/);
  assert.doesNotMatch(h, /CIN\s*[A-Z0-9]{21}/);
  assert.doesNotMatch(h, /LHDN|fully incorporated/i);
});

test("build registers /in/pos/ with India list prices from site.config", () => {
  const b = read("build.mjs");
  assert.match(b, /in-pos\.html/);
  assert.match(b, /\/in\/pos\//);
  assert.match(b, /priceStarterIn/);
  assert.match(b, /priceProIn/);
  const cfg = JSON.parse(read("site.config.json"));
  assert.equal(cfg.pricing.IN.monthly.starter, 987);
  assert.equal(cfg.pricing.IN.monthly.pro, 1987);
});

test("built /in/pos/ page, sitemap and assets stay consistent", () => {
  const r = spawnSync(process.execPath, ["build.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const page = read("dist/in/pos/index.html");
  const sitemap = read("dist/sitemap.xml");
  assert.match(page, /Cafe POS India \| Ring up a bill/);
  assert.match(page, /canonical" href="https:\/\/www\.ordenz\.com\/in\/pos\/"/);
  assert.match(page, /₹987/);
  assert.match(page, /₹1987/);
  assert.match(page, /FAQPage/);
  assert.match(page, /Filter Coffee/);
  assert.match(sitemap, /https:\/\/www\.ordenz\.com\/in\/pos\//);
  assert.ok(fs.existsSync(path.join(root, "dist/assets/lp-bill-in.mjs")));
  assert.ok(fs.existsSync(path.join(root, "dist/assets/img/pay-upi-qr.webp")));
  assert.ok(fs.existsSync(path.join(root, "dist/assets/img/counter.webp")));
});
