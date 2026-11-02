// The home-page tour video and the scroll animations ship safely: muted silent autoplay, a poster,
// captions burned in, a small file, no third-party frames unless a YouTube ID is set.
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the hero video is muted, inline and has a poster, so it can start silently on phones',()=>{const h=read('src/index.html');assert.match(h,/<video id="promoVideo" muted loop playsinline preload="metadata" poster="\/assets\/video\/ordenz-promo-v2\.jpg"/);assert.match(h,/src="\/assets\/video\/ordenz-promo-v2\.mp4" type="video\/mp4"/);assert.ok(!/<video[^>]*\bautoplay\b/.test(h),'autoplay is switched on by motion.js only when motion and data saving allow it');});
test('video files exist and stay small enough for the host',()=>{for(const f of ['ordenz-promo-v2.mp4','ordenz-promo-v2.webm','ordenz-promo-v2.jpg']){const s=fs.statSync(new URL('../src/assets/video/'+f,import.meta.url)).size;assert.ok(s>1000&&s<20*1024*1024,f)}});
test('the security policy allows our own video and only the privacy-enhanced YouTube player',()=>{const c=read('src/_headers');assert.match(c,/media-src 'self'/);assert.match(c,/frame-src https:\/\/www\.youtube-nocookie\.com;/);assert.ok(!/frame-src[^;]*\*/.test(c));assert.match(c,/Permissions-Policy: camera=\(\), geolocation=\(\), microphone=\(\)/);assert.doesNotMatch(c,/geolocation=\(self\)/);assert.match(c,/Strict-Transport-Security: max-age=31536000; includeSubDomains/);assert.match(c,/Cross-Origin-Opener-Policy: same-origin/);assert.match(c,/Cross-Origin-Resource-Policy: same-origin/);});
test('motion respects reduced-motion and data saving, and only accepts a real YouTube ID',()=>{const j=read('src/assets/motion.js');assert.match(j,/prefers-reduced-motion: reduce/);assert.match(j,/saveData/);assert.match(j,/\^\[A-Za-z0-9_-\]\{11\}\$/);assert.match(j,/youtube-nocookie\.com\/embed\//);assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(j),'builds no HTML from strings');});
test('features and FAQs match current DuitNow, delivery and referral behaviour',()=>{
  const f=read('src/features.html');
  assert.match(f,/approved Fiuu Offline Payment merchant/);
  assert.match(f,/signed webhook/);
  assert.match(f,/Tell a friend\. You both get a month/);
  assert.match(f,/They pick 4:15/);
  assert.doesNotMatch(f,/automatic DuitNow QR generation and payment confirmation are not currently included/);
  assert.doesNotMatch(f,/Orders are typed in\. This is not a live Swiggy or Zomato partner API/);
  assert.doesNotMatch(f,/Malaysian DuitNow recording is manual/);
  const home=read('src/index.html');
  assert.match(home,/data-for-country="MY"/);
  assert.match(home,/RM200 of float/);
  assert.match(home,/records that app commission/);
  assert.doesNotMatch(home,/keeps the commission/);
  assert.match(home,/signed webhook/);
  assert.match(home,/Book a walk-through/);
  assert.match(home,/ways to sign in/);
  assert.match(home,/All-rounder/);
});
test('header country switcher is a native select with no geo lookup',()=>{
  const header=read('src/_partials/header.html');
  const js=read('src/assets/country.js');
  assert.match(header,/id="countrySel"/);
  assert.match(header,/aria-label="Country"/);
  assert.match(js,/ordenz-country/);
  assert.match(js,/Asia\/Kolkata/);
  assert.match(js,/Asia\/Calcutta/);
  assert.match(js,/Asia\/Kuala_Lumpur/);
  assert.match(js,/Asia\/Kuching/);
  assert.doesNotMatch(js,/geolocation|ipapi|geo\.json|Load Balancing/i);
});
