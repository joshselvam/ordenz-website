// Spotlight: the eight highlighted screens on the home and features pages use real app shots,
// app tab names, short copy, and land on a matching section of the features page.
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const spot=read('src/_partials/spotlight.html');

test('home and features both include the spotlight partial',()=>{
  assert.match(read('src/index.html'),/\{\{> spotlight\}\}/);
  assert.match(read('src/features.html'),/\{\{> spotlight\}\}/);
});

test('each spotlight tile names an app screen and links to a real features section',()=>{
  const features=read('src/features.html');
  for(const tag of ['Kitchen','Token screen','Showcase','Guest','Owner · cafe at a glance','Accounting export · Pro','Crew desk','Well connected'])assert.match(spot,new RegExp(`spot-tag">${tag}`),tag);
  const anchors=[...spot.matchAll(/href="\/features\/#([\w-]+)"/g)].map(m=>m[1]);
  assert.equal(anchors.length,8);
  for(const a of anchors)assert.match(features,new RegExp(`id="${a}"`),a);
});

test('every spotlight screenshot exists and stays small',()=>{
  const srcs=[...spot.matchAll(/src="\/assets\/img\/([^"]+)"/g)].map(m=>m[1]);
  assert.ok(srcs.length>=8);
  for(const s of srcs){const size=fs.statSync(new URL('../src/assets/img/'+s,import.meta.url)).size;assert.ok(size>5000&&size<900*1024,s)}
});

test('spotlight lines stay short and keep the plan truths',()=>{
  for(const [,p] of spot.matchAll(/<p[^>]*>([^<]+)<\/p>/g))assert.ok(p.split(/\s+/).length<=16,`too long: ${p}`);
  for(const [,h] of spot.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g))assert.ok(h.split(/\s+/).length<=7,`too long: ${h}`);
  assert.match(spot,/Specials need the yearly Ads add-on/);
  assert.match(spot,/It does not speak/);
  assert.match(spot,/Always chimes\. Speaks only when the owner turns on Speak the token/);
  assert.match(spot,/A working sheet, not a filing/);
});

test('features has standalone Showcase and Guest sections with real shots',()=>{
  const f=read('src/features.html');
  assert.match(f,/id="showcase"[\s\S]*?showcase\.webp/);
  assert.match(f,/id="guest"[\s\S]*?guest\.webp/);
  assert.match(f,/not an overlay on the till/);
});

test('Malaysia visitors see Malaysia screens, and Recipes shows recipes',()=>{
  const f=read('src/features.html');
  assert.match(spot,/data-for-country="MY" src="\/assets\/img\/outlets-my\.webp"/);
  assert.match(spot,/data-for-country="MY" src="\/assets\/img\/guest-my\.webp"/);
  assert.match(spot,/data-for-country="MY" src="\/assets\/img\/token-screen-my\.webp"/);
  assert.match(spot,/data-for-country="MY" src="\/assets\/img\/showcase-my\.webp"/);
  assert.match(f,/data-for-country="MY" src="\/assets\/img\/outlets-my\.webp"/);
  assert.match(f,/accounting-export-my\.webp/);
  const acc=spot.split('href="/features/#accounts"')[1].split('</a>')[0];
  assert.match(acc,/data-for-country="MY" src="\/assets\/img\/accounting-export-my\.webp"/);
  assert.doesNotMatch(acc,/myinvois/i);
  assert.match(f,/Recipes · Pro[\s\S]*?recipes\.webp/);
  assert.match(f,/Recipes · Pro[\s\S]*?recipes-my\.webp/);
  for(const b of f.split('class="feature"').filter(x=>x.includes('Recipes · Pro')))assert.doesNotMatch(b.split('</div></div>')[0]+b.split('</div></div>')[1],/guest-/);
});
