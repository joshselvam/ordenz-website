import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Features shows static Get your cafe ready setup-rail preview", () => {
  const h = read("src/features.html");
  assert.match(h, /id="cafe-ready"/);
  assert.match(h, /setup-rail-preview/);
  assert.match(h, /Get your cafe ready/);
  assert.match(h, /A clear setup checklist on Owner/);
  assert.doesNotMatch(h, /7-day challenge|Day [1-7] of 7/i);
  const css = read("src/assets/site.css");
  assert.match(css, /\.setup-rail-preview\{/);
  assert.match(css, /\.srp-rail\{/);
});
