import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const cfg = JSON.parse(read("site.config.json"));

test("ads tag keys stay empty by default — no invented Google Ads IDs", () => {
  assert.equal(cfg.adsTagId, "");
  assert.equal(cfg.adsConvSignupClickLabel, "");
  assert.equal(cfg.adsConvDemoLabel, "");
});

test("lp-ads.js wires signup click + demo submit and never hardcodes AW- IDs", () => {
  const j = read("src/assets/lp-ads.js");
  assert.match(j, /data-ads-tag/);
  assert.match(j, /data-ads-conv-signup/);
  assert.match(j, /data-ads-conv-demo/);
  assert.match(j, /data-ads-conv=['"]signup['"]/);
  assert.match(j, /lpDemoForm/);
  assert.match(j, /conversion/);
  assert.match(j, /gtag/);
  assert.doesNotMatch(j, /AW-\d{6,}/);
});

test("build leaves base CSP unchanged when adsTagId is empty", () => {
  const r = spawnSync(process.execPath, ["build.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const headers = read("dist/_headers");
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Strict-Transport-Security:/);
  assert.doesNotMatch(headers, /googletagmanager\.com/);
  assert.doesNotMatch(headers, /\/my\/pos\/\s*\n\s*Content-Security-Policy:[^\n]*googletagmanager/);
  const page = read("dist/my/pos/index.html");
  assert.doesNotMatch(page, /lp-ads\.js/);
  assert.doesNotMatch(page, /googletagmanager\.com\/gtag/);
});

test("README notes that real signup conversion needs an ordenz-app PR", () => {
  const md = read("README.md");
  assert.match(md, /adsTagId/);
  assert.match(md, /ordenz-app/);
  assert.match(md, /gclid/);
});
