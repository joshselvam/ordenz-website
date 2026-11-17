// Malaysia Google Ads / SEO landing page at /my/pos/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const cfg = JSON.parse(read('site.config.json'));

test('MY ads LP source targets cafe POS Malaysia with honest claims only', () => {
  const h = read('src/my-pos.html');
  assert.match(h, /class="lp-my"/);
  assert.match(h, /Cafe POS for Malaysia/);
  assert.match(h, /Not Pos Malaysia|not postal Pos Malaysia/i);
  assert.match(h, /Start free trial/);
  assert.match(h, /\{\{appUrl\}\}/);
  assert.match(h, /counter-my\.webp/);
  assert.match(h, /kiosk-malay\.webp/);
  assert.match(h, /offline-my\.webp/);
  assert.match(h, /pay-duitnow-qr\.webp/);
  assert.match(h, /\{\{priceStarterMy\}\}/);
  assert.match(h, /\{\{priceProMy\}\}/);
  assert.match(h, /30-day Pro trial/);
  assert.match(h, /approved Fiuu merchant/);
  assert.match(h, /MyInvois files/);
  assert.match(h, /does not log in as the taxpayer/);
  assert.doesNotMatch(h, /LHDN e-Invoicing ready|20,?000\+ businesses|55% off|Get a free demo|Google Places|powered by Google/i);
  assert.doesNotMatch(h, /4\.7 on Google|Trusted by \d/);
  assert.match(h, /data-utm-pass/);
  assert.match(h, /lp-utm\.js/);
  assert.match(h, /ordenz-country","MY"/);
  assert.match(h, /wa\.me\/\{\{waNumberMY\}\}/);
});

test('lp-utm.js forces MY and forwards utm_* without inventing tracking pixels', () => {
  const j = read('src/assets/lp-utm.js');
  assert.match(j, /ordenz-country/);
  assert.match(j, /["']MY["']/);
  assert.match(j, /utm_source/);
  assert.match(j, /utm_medium/);
  assert.match(j, /utm_campaign/);
  assert.match(j, /data-utm-pass/);
  assert.doesNotMatch(j, /gtag|google-analytics|G-[A-Z0-9]|facebook|pixel/i);
});

test('build registers /my/pos/ with ads meta and list prices from site.config', () => {
  const b = read('build.mjs');
  assert.match(b, /my-pos\.html/);
  assert.match(b, /my\/pos\/index\.html/);
  assert.match(b, /path: "\/my\/pos\/"/);
  assert.match(b, /Cafe POS Malaysia/);
  assert.match(b, /Not Pos Malaysia postage/);
  assert.match(b, /priceStarterMy/);
  assert.match(b, /priceProMy/);
  assert.match(b, /from \$\{cfg\.priceStarterMy\}/);
  assert.equal(cfg.pricing.MY.monthly.starter, 97);
  assert.equal(cfg.pricing.MY.monthly.pro, 197);
});

test('built /my/pos/ page, sitemap, robots and redirects stay consistent', () => {
  const r = spawnSync(process.execPath, ['build.mjs'], {cwd: root, encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const page = read('dist/my/pos/index.html');
  assert.match(page, /<title>Cafe POS Malaysia \| F&amp;B self-order kiosk \| OrdenZ<\/title>/);
  assert.match(page, /rel="canonical" href="https:\/\/www\.ordenz\.com\/my\/pos\/"/);
  assert.match(page, /property="og:title"/);
  assert.match(page, /property="og:description"/);
  assert.match(page, /From RM97 \/ month/);
  assert.match(page, /RM197 Pro/);
  assert.match(page, /href="https:\/\/app\.ordenz\.com"/);
  assert.match(page, /wa\.me\/601116441186/);
  assert.match(page, /SoftwareApplication/);
  assert.match(page, /Organization/);
  assert.doesNotMatch(page, /LHDN e-Invoicing ready|20,?000\+/i);
  const map = read('dist/sitemap.xml');
  assert.match(map, /https:\/\/www\.ordenz\.com\/my\/pos\//);
  const robots = read('dist/robots.txt');
  assert.match(robots, /Sitemap: https:\/\/www\.ordenz\.com\/sitemap\.xml/);
  assert.match(read('dist/_redirects'), /\/my\/pos\s+\/my\/pos\/\s+301/);
  assert.ok(fs.existsSync(path.join(root, 'dist/assets/lp-utm.js')));
});
