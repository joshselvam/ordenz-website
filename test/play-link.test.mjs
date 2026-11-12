import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const cfg=JSON.parse(fs.readFileSync(new URL('../site.config.json',import.meta.url)));
const PLAY='https://play.google.com/store/apps/details?id=com.joshselvam.ordernest';
test('the Google Play link is the live OrdenZ app',()=>{assert.equal(cfg.playUrl,PLAY);});
test('home and features pages show Get it on Google Play once built',()=>{
 execFileSync(process.execPath,['build.mjs'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
 for(const page of ['../dist/index.html','../dist/features/index.html']){
  const html=fs.readFileSync(new URL(page,import.meta.url),'utf8');
  assert.ok(html.includes(`href="${PLAY}" rel="noopener">Get it on Google Play</a>`),page);
  assert.doesNotMatch(html,/\{\{#?\/?(if|unless) playUrl/,page);
 }
});
test('build refuses a playUrl that is not a Google Play app link',()=>{
 const src=fs.readFileSync(new URL('../build.mjs',import.meta.url),'utf8');
 const re=new RegExp(src.match(/if \(cfg\.playUrl && !\/(.+)\/\.test\(cfg\.playUrl\)\)/)[1]);
 assert.ok(re.test(PLAY));
 for(const bad of ['http://play.google.com/store/apps/details?id=com.x.y','https://evil.example/store/apps/details?id=com.x.y','https://play.google.com/store/apps/details?id=com.x.y&x=1','javascript:alert(1)'])assert.ok(!re.test(bad),bad);
});
test('home hero shows the Play badge beside the OrdenZ wordmark',()=>{
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/<div class="brand-row"><p class="brand-mark" aria-hidden="true">OrdenZ<\/p><a class="play-badge" href="https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.joshselvam\.ordernest" rel="noopener" aria-label="Get OrdenZ on Google Play">/);
 const css=fs.readFileSync(new URL('../src/assets/site.css',import.meta.url),'utf8');
 assert.match(css,/\.play-badge\{display:inline-flex[^}]*background:#0E5B49;color:#FFF6E8/,'brand green with beige text');
});
