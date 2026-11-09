import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("Cafe in motion picker is local noindex with five front-page variants", () => {
  const page = read("src/cafe-in-motion.html");
  const css = read("src/assets/cafe-in-motion.css");
  const js = read("src/assets/cafe-in-motion.js");
  const home = read("src/index.html");
  assert.match(page, /meta name="robots" content="noindex"/);
  assert.match(page, /data-cafe-in-motion/);
  for (const n of ["1", "2", "3", "4", "5"]) {
    assert.match(page, new RegExp('href="\\?v=' + n + '"'));
    assert.match(css, new RegExp('data-v="' + n + '"'));
  }
  assert.match(page, /Shift reel/);
  assert.match(page, /Morning rush/);
  assert.match(page, /Counter stage/);
  assert.match(page, /Token moment/);
  assert.match(page, /Guest latte/);
  assert.match(page, /Cafe latte · ₹200/);
  assert.match(page, /Teh tarik · RM5/);
  assert.match(page, /Add-ons are yearly/);
  assert.match(page, /30 days of Pro/);
  assert.match(page, /Starter or Pro/);
  assert.match(js, /Shift reel/);
  assert.match(js, /history\.pushState|history\[/);
  assert.match(page, /class="cim-token-hero" aria-hidden="true"/);
  assert.match(page, /class="cim-guest-hero" aria-hidden="true"/);
  assert.match(js, /tokenHero\.setAttribute\("aria-hidden", n === "4" \? "false" : "true"\)/);
  assert.match(js, /guestHero\.setAttribute\("aria-hidden", n === "5" \? "false" : "true"\)/);
  assert.doesNotMatch(home, /cafe-in-motion\.html/);
  assert.doesNotMatch(page + css + js, /Inter|Roboto|Arial|purple-on-white|terracotta/i);
});

test("Live home ships Shift reel Cafe in motion with muted autoplay and short chapters", () => {
  const home = read("src/index.html");
  const css = read("src/assets/site.css");
  const js = read("src/assets/motion.js");
  assert.match(home, /class="hero cim-hero"/);
  assert.match(home, /Cafe in motion/);
  assert.match(home, /class="brand-mark"/);
  assert.match(home, />OrdenZ</);
  assert.match(home, /id="day" class="cim-shift"/);
  assert.match(home, /One shift\. Four screens\./);
  assert.match(home, /class="cim-chapters"/);
  assert.match(home, /class="cim-chapter"/);
  assert.match(home, /Slim Starter stays counter-only/);
  assert.match(home, /Pro tools stay Pro/);
  assert.doesNotMatch(home, /Just click to start|Start the preview|id="showStart"|id="showRestart"/);
  assert.match(home, /Book a full walkthrough/);
  assert.doesNotMatch(home, /Open the browser preview/);
  assert.doesNotMatch(home, /class="show-cafe"/);
  assert.doesNotMatch(home, /id="heroShow"[\s\S]*botanical-cafe\.webp/);
  assert.match(home, /1 × Cafe latte/);
  assert.match(home, /Cafe latte · ₹200/);
  assert.match(css, /\.cim-chapters\{/);
  assert.match(css, /\.cim-hero \.brand-mark\{/);
  assert.match(css, /\.hero-art\.has-video \.show\{[^}]*min-height:min\(72vh,640px\)/);
  assert.match(js, /video\.autoplay = true/);
  assert.match(js, /if \(reduce \|\| held\(\) \|\| timer \|\| slides\.length < 2\) return/);
  assert.doesNotMatch(js, /startShow|showStart|Just click to start|restartShow/);
  assert.doesNotMatch(js, /window\.open/);
});

test("Demo page embeds the browser preview iframe with kiosk open", () => {
  const demo = read("src/demo.html");
  const css = read("src/assets/site.css");
  const headers = read("src/_headers");
  assert.match(demo, /class="demo-embed"/);
  assert.match(demo, /<iframe[^>]*class="demo-embed-frame"[^>]*src="\/demo\/preview\/#kiosk"/);
  assert.match(demo, /title="OrdenZ browser preview — kiosk open"/);
  assert.match(demo, /Open the preview full screen/);
  assert.match(demo, /Book a full walkthrough/);
  assert.doesNotMatch(demo, /Open the browser preview/);
  assert.match(css, /\.demo-embed\{/);
  assert.match(css, /\.demo-embed-frame\{/);
  assert.match(headers, /frame-src 'self' https:\/\/www\.youtube-nocookie\.com/);
});

test("Cafe in motion picker stage also uses muted autoplay, not a click gate", () => {
  const page = read("src/cafe-in-motion.html");
  assert.doesNotMatch(page, /id="showStart"|Just click to start|Start the preview|id="showRestart"/);
  assert.doesNotMatch(page, /Open the browser preview/);
  assert.match(page, /id="promoSound"/);
  assert.doesNotMatch(page, /id="promoSound" hidden/);
});
