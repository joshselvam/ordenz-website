import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("phone header uses a forest-mint menu button and keeps every public link", () => {
  const header = read("src/_partials/header.html");
  const css = read("src/assets/site.css");
  const js = read("src/assets/theme.js");
  assert.match(header, /id="navToggle"/);
  assert.match(header, /aria-controls="siteNav"/);
  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /id="siteNav"/);
  assert.match(header, /href="\/features\/"/);
  assert.match(header, /href="\/demo\/"/);
  assert.match(header, /href="\/features\/#pricing"/);
  assert.match(header, /href="\/start-a-cafe\/"/);
  assert.match(header, /href="\/guide\/"/);
  assert.match(header, /href="\/support\/"/);
  assert.match(css, /\.nav-toggle\{[^}]*--green-soft/);
  assert.match(css, /\.nav-toggle\{[^}]*--green/);
  assert.doesNotMatch(css, /\.nav-toggle\{[^}]*#C98566|\.nav-toggle\{[^}]*terracotta/i);
  assert.match(css, /@media\(max-width:880px\)\{[\s\S]*\.nav-toggle\{display:inline-flex\}/);
  assert.match(css, /@media\(max-width:880px\)\{[\s\S]*\.nav\{display:none/);
  assert.match(css, /\.top\.is-open \.nav\{display:flex\}/);
  assert.match(js, /getElementById\("navToggle"\)/);
  assert.match(js, /aria-expanded/);
  assert.match(js, /Escape/);
  assert.match(js, /max-width:880px/);
});

test("phone hero stacks in one column and keeps the slideshow inside the viewport", () => {
  const css = read("src/assets/site.css");
  const twoCol = css.lastIndexOf("grid-template-columns:minmax(360px,.58fr) minmax(0,2fr)");
  const phoneCol = css.lastIndexOf("@media (max-width:880px)");
  const oneCol = css.lastIndexOf("grid-template-columns:1fr");
  assert.ok(twoCol > 0, "desktop two-column hero is still defined");
  assert.ok(phoneCol > twoCol, "phone hero override comes after the two-column rule");
  assert.ok(oneCol > twoCol, "phone stacks the hero to one column after the two-column rule");
  assert.match(css, /overflow-x:clip/);
  assert.match(css, /\.hero-art\.has-video\{[^}]*overflow:hidden/);
  assert.match(css, /\.hero \.wrap>\*\{[^}]*min-width:0/);
  assert.match(css, /\.hero-art\.has-video \.promo video\{[^}]*max-width:100%/);
  assert.doesNotMatch(css, /\.hero-art\.has-video\{height:auto;overflow:visible\}/);
});

test("phone and desktop keep the storefront beside the headline, not below the slideshow", () => {
  const home = read("src/index.html");
  const css = read("src/assets/site.css");
  assert.ok(fs.existsSync(new URL("../src/assets/img/cafe-storefront.webp", import.meta.url)));
  assert.match(home, /class="hero-title"/);
  assert.match(home, /src="\/assets\/img\/cafe-storefront\.webp"/);
  assert.match(home, /width="244"/);
  assert.match(home, /height="194"/);
  assert.doesNotMatch(home, /hero-art has-video"[\s\S]*class="cafe-photo"/);
  assert.match(css, /\.hero-title\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(110px,150px\)/);
  assert.match(css, /@media \(max-width:880px\)\{[\s\S]*\.hero-title\{[^}]*minmax\(88px,28%\)/);
  assert.match(css, /@media \(max-width:880px\)\{[\s\S]*\.cafe-photo\{[^}]*max-width:128px/);
  assert.match(css, /\.cafe-photo\{[^}]*object-fit:contain/);
  assert.doesNotMatch(css, /\.cafe-photo\{[^}]*grid-row:2/);
  assert.doesNotMatch(css, /\.hero-title\{[^}]*overflow/);
});

test("Hero slideshow has no botanical cafe strip; stage and video grow larger", () => {
  const home = read("src/index.html");
  const css = read("src/assets/site.css");
  assert.match(home, /id="show-guest"/);
  assert.match(home, /id="heroShow"[\s\S]*class="show-nav"/);
  assert.doesNotMatch(home, /id="showStart"|Just click to start|Start the preview|id="showRestart"/);
  assert.doesNotMatch(home, /class="show-cafe"/);
  assert.doesNotMatch(home, /id="heroShow"[\s\S]*botanical-cafe\.webp/);
  assert.doesNotMatch(home, /Open the browser preview/);
  assert.doesNotMatch(css, /\.hero-art\.has-video \.show-cafe\{/);
  assert.match(css, /\.hero-art\.has-video \.show\{[^}]*min-height:min\(88svh,860px\)/);
  assert.match(css, /\.hero-art\.has-video \.promo\{[^}]*min-height:min\(72svh,760px\)/);
  assert.match(css, /@media \(max-width:880px\)\{[\s\S]*\.hero-art\.has-video \.show\{[^}]*height:auto/);
  assert.match(home, /id="show-guest"[\s\S]*guest\.webp/);
  assert.match(home, /id="show-showcase"[\s\S]*showcase\.webp/);
  assert.match(home, /id="show-token"[\s\S]*token-screen\.webp/);
  assert.match(home, /Cafe in motion/);
  assert.match(css, /@media \(max-width:880px\)\{[\s\S]*\.cim-chapters\{[^}]*1fr 1fr/);
});

test("Guest, Showcase and Token slides use the latest country screenshots", () => {
  const home = read("src/index.html");
  const css = read("src/assets/site.css");
  assert.match(home, /id="show-guest"[\s\S]*data-for-country="IN" src="\/assets\/img\/guest\.webp"/);
  assert.match(home, /id="show-guest"[\s\S]*data-for-country="MY" src="\/assets\/img\/guest-my\.webp"/);
  assert.match(home, /id="show-showcase"[\s\S]*data-for-country="IN" src="\/assets\/img\/showcase\.webp"/);
  assert.match(home, /id="show-showcase"[\s\S]*data-for-country="MY" src="\/assets\/img\/showcase-my\.webp"/);
  assert.match(home, /id="show-token"[\s\S]*data-for-country="IN" src="\/assets\/img\/token-screen\.webp"/);
  assert.match(home, /id="show-token"[\s\S]*data-for-country="MY" src="\/assets\/img\/token-screen-my\.webp"/);
  assert.match(home, /In preparation/);
  assert.match(home, /Ready for collection/);
  assert.doesNotMatch(home, /option-b-drink|token-board-fill\.gif|swap after pick|shot-swap/);
  assert.match(css, /\.show-slide \.live-shot\{[^}]*object-fit:contain/);
  assert.match(css, /\.show-slide \.live-shot\{[^}]*object-position:center/);
  assert.doesNotMatch(home, /ZUS|AEON/i);
});

test("Showcase picture options stay off the live home slideshow", () => {
  const home = read("src/index.html");
  const css = read("src/assets/site.css");
  const js = read("src/assets/motion.js");
  const dir = new URL("../src/assets/img/showcase/", import.meta.url);
  assert.ok(fs.existsSync(new URL("option-b-drink.jpg", dir)));
  assert.doesNotMatch(home, /option-a-counter|option-b-drink|option-c-kitchen|option-d-guest|swap after pick|shot-swap/);
  assert.match(css, /\.food-shot\{[^}]*object-fit:cover/);
  assert.match(css, /\.food-photo\{[^}]*object-fit:cover/);
  assert.doesNotMatch(css, /shot-swap/);
  assert.doesNotMatch(js, /option-[abcd]|shot-swap|swap after pick/);
});

test("homepage hero copy stays short and still names OrdenZ", () => {
  const home = read("src/index.html");
  assert.match(home, /Good orders\./);
  assert.match(home, /Great days\./);
  assert.match(home, /OrdenZ runs the counter, guest tablet, kitchen and token screen/);
  assert.match(home, /Cheap Android tablets/);
  assert.match(home, /Set up free\. 30 days of Pro from the first real bill, or from day 15\. Then Free \(1 paired device, 50 orders\/day\), unless you pick Starter or Pro\./);
  assert.doesNotMatch(home, /From the first coffee at 7 am/);
  assert.doesNotMatch(home, /self-order kiosk · kitchen screen/);
  assert.match(home, /A second tablet signed in as Guest/);
  assert.match(home, /not an overlay on the till/);
  assert.match(home, /It does not speak/);
  assert.match(home, /Speak the token is on in House/);
  assert.match(home, /It does not read the dish names/);
});
