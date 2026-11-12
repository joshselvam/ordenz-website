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
