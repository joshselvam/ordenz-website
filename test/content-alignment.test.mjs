import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('a preview-only deployment does not promise role-specific live screens',()=>{
 const config=JSON.parse(read('site.config.json'));
 const demo=read('dist/demo/index.html');
 if(!config.demoUrl){
  assert.match(demo,/Try a small browser preview/);
  assert.match(demo,/limited preview uses simulated payments/);
  assert.doesNotMatch(demo,/id="roles"|id="tour"|A real cafe, open right now/);
  assert.match(demo,/Book a full walkthrough/);
 }
});

test('all browser preview inline scripts are covered by the common CSP',()=>{
 const headers=read('dist/_headers');
 assert.doesNotMatch(headers,/! Content-Security-Policy/);
 const html=read('dist/demo/preview/index.html');
 return import('node:crypto').then(({createHash})=>{
  let count=0;
  for(const m of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
   if(!m[1].trim())continue;
   assert.ok(headers.includes("'sha256-"+createHash('sha256').update(m[1].replace(/\r\n?/g,'\n')).digest('base64')+"'"));count++;
  }
  assert.ok(count>0);
 });
});

test('client claims match current printing, stock and optional support AI behaviour',()=>{
 const features=read('src/features.html'),privacy=read('src/privacy.html'),support=read('src/support.html');
 assert.match(features,/supported stock, supplier, offer and kitchen documents print as compact 58\/80 mm slips/);
 assert.match(features,/sold-out items are marked and cannot be added/);
 assert.match(features,/Each staff member has their own PIN/);
 assert.match(privacy,/configured AI service may receive your question/);
 assert.match(privacy,/browser’s local storage/);
 assert.match(privacy,/privacy-enhanced player/);
 assert.match(support,/Support tickets &amp; chat/);
});
