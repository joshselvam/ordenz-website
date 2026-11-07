import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("hero design preview uses its own layout and stays off the live home page", () => {
  const page = read("src/hero-design.html");
  const css = read("src/assets/hero-design.css");
  const js = read("src/assets/hero-design.js");
  const home = read("src/index.html");
  assert.match(page, /href="\/assets\/hero-design\.css"/);
  assert.match(page, /src="\/assets\/hero-design\.js"/);
  assert.doesNotMatch(page, /href="\/assets\/site\.css"|src="\/assets\/motion\.js"/);
  assert.match(page, /class="hd-hero"/);
  assert.match(page, /src="\/assets\/img\/botanical-cafe\.webp"/);
  assert.match(page, /alt="Plant-filled cafe interior"/);
  assert.match(page, /<video id="promoVideo" muted loop playsinline preload="metadata" poster="\/assets\/video\/ordenz-one-day-v3\.jpg"/);
  assert.ok(!/<video[^>]*\bautoplay\b/.test(page), "the preview video tag has no autoplay attribute");
  assert.match(page, /class="hd-slide is-on" id="show-counter"/);
  assert.match(page, /id="show-guest"/);
  assert.match(page, /id="show-showcase"/);
  assert.match(page, /id="show-token"/);
  assert.match(page, /class="hd-dot"/);
  assert.match(page, /id="sceneCap"/);
  assert.match(page, /unless you pick Starter or Pro/);
  assert.match(js, /closest\("\.hd-stage"\)/);
  assert.match(js, /querySelectorAll\("\.hd-dot"\)/);
  assert.match(css, /\.hd-slide\[hidden\]/);
  assert.doesNotMatch(home, /hero-design/);
  assert.match(css, /The live home page does not use this file/);
});
