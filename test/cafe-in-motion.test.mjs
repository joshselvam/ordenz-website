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
  assert.match(home, /Slim Starter covers the till, kiosk, kitchen and token screen \(up to 5 devices\)/);
  assert.match(home, /other Pro tools stay on Pro/);
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
  assert.match(demo, /class="demo-setup-row"/);
  assert.match(demo, /Book a full walkthrough/);
  assert.doesNotMatch(demo, /Open the browser preview/);
  assert.match(css, /\.demo-setup-row\{/);
  assert.match(css, /\.demo-embed\{/);
  assert.match(css, /\.demo-embed-frame\{/);
  assert.match(headers, /frame-src 'self' https:\/\/www\.youtube-nocookie\.com/);
});

test("Demo India and Malaysia sections are visual-first with short copy", () => {
  const demo = read("src/demo.html");
  const css = read("src/assets/site.css");
  assert.ok(fs.existsSync(new URL("../src/assets/img/kiosk-india-tamil.webp", import.meta.url)));
  assert.match(demo, /id="india"/);
  assert.match(demo, /id="malaysia"/);
  assert.match(demo, /class="demo-fade"/);
  assert.match(demo, /demo-shots/);
  assert.match(demo, /kiosk-india-tamil\.webp/);
  assert.match(demo, /phone-tamil\.webp/);
  assert.match(demo, /kiosk-malay\.webp/);
  assert.match(demo, /counter-my\.webp/);
  assert.match(demo, /owner-my\.webp/);
  assert.match(demo, /receipt-my\.webp/);
  assert.match(demo, /myinvois\.webp/);
  assert.match(demo, /₹ · UPI · English \+ Tamil on the kiosk/);
  assert.match(demo, /RM · DuitNow · SST · MyInvois/);
  assert.doesNotMatch(demo, /The same app set up for Malaysia: prices in RM/);
  assert.doesNotMatch(demo, /Loyalty on that demo is 1 point per RM1/);
  assert.match(css, /\.demo-shots\{/);
  assert.match(css, /\.demo-fade\{/);
  assert.match(css, /@keyframes demoFade/);
});

test("Cafe in motion picker stage also uses muted autoplay, not a click gate", () => {
  const page = read("src/cafe-in-motion.html");
  assert.doesNotMatch(page, /id="showStart"|Just click to start|Start the preview|id="showRestart"/);
  assert.doesNotMatch(page, /Open the browser preview/);
  assert.match(page, /id="promoSound"/);
  assert.doesNotMatch(page, /id="promoSound" hidden/);
});
