import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("hero layout preview keeps the real cafe photo, muted tour, and four scenes off the live home page", () => {
  const page = read("src/hero-layouts.html");
  const css = read("src/assets/hero-layouts.css");
  const js = read("src/assets/hero-layouts.js");
  const home = read("src/index.html");
  assert.match(page, /src="\/assets\/img\/botanical-cafe\.webp"/);
  assert.match(page, /alt="Plant-filled cafe interior"/);
  assert.match(page, /<video id="promoVideo" muted loop playsinline preload="metadata" poster="\/assets\/video\/ordenz-one-day-v3\.jpg"/);
  assert.match(page, /src="\/assets\/video\/ordenz-one-day-v3\.mp4"/);
  assert.match(page, /src="\/assets\/video\/ordenz-one-day-v3\.webm"/);
  assert.ok(!/<video[^>]*\bautoplay\b/.test(page), "the preview video tag has no autoplay attribute");
  assert.match(page, /Watch with sound/);
  assert.match(page, /50-second tour/);
  assert.match(page, /Counter tablet\. The cashier stays here\./);
  assert.match(js, /A second tablet signed in as Guest\. The bill in one language\. After payment, a loyalty QR for their own phone\. The cashier stays on the counter\./);
  assert.match(js, /Shows one language, and a food photo when one is stored\. About 6 min is an estimate, not the clock\./);
  assert.match(js, /Shows the number\. Speaks only when Speak the token is on in House\. It does not read the dish names\./);
  assert.match(page, /data-scene="counter"[^>]*>/);
  assert.match(page, /Counter<\/button>/);
  assert.match(page, /Guest<\/button>/);
  assert.match(page, /Showcase<\/button>/);
  assert.match(page, /Token<\/button>/);
  assert.match(page, /src="\/assets\/motion\.js"/);
  for (const n of ["1", "2", "3", "4", "5", "6"]) {
    assert.match(page, new RegExp('href="\\?layout=' + n + '"'));
    assert.match(css, new RegExp('data-layout="' + n + '"'));
  }
  assert.match(css, /object-fit:contain/);
  assert.doesNotMatch(page + css + js, /dual display|two monitors|PC \+/i);
  assert.doesNotMatch(js, /setInterval|autoplay/);
  assert.match(home, /id="heroShow"/);
  assert.doesNotMatch(home, /hero-layouts/);
});
