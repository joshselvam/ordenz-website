import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {execFileSync} from 'node:child_process';
const cfg=JSON.parse(fs.readFileSync(new URL('../site.config.json',import.meta.url)));
test('India and Malaysia WhatsApp numbers are configured',()=>{
 assert.equal(cfg.whatsapp.replace(/\D/g,''),'917358507977');
 assert.equal(cfg.whatsappMY.replace(/\D/g,''),'601116441186');
});
test('built pages carry both numbers; the India number is the default link',()=>{
 execFileSync(process.execPath,['build.mjs'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
 for(const page of ['../dist/index.html','../dist/support/index.html']){
  const html=fs.readFileSync(new URL(page,import.meta.url),'utf8');
  assert.match(html,/<html lang="en" data-wa-in="917358507977" data-wa-my="601116441186">/,page);
  assert.ok(html.includes('https://wa.me/917358507977'),page);
 }
});
function run(country){
 const links=[{h:'https://wa.me/917358507977?text=Hi'},{h:'https://wa.me/917358507977'}].map(l=>({getAttribute:()=>l.h,setAttribute:(_,v)=>{l.h=v},l}));
 const root={dataset:{},getAttribute:k=>({'data-wa-in':'917358507977','data-wa-my':'601116441186'})[k]};
 const doc={documentElement:root,readyState:'complete',querySelector:()=>null,getElementById:()=>null,querySelectorAll:()=>links,addEventListener(){},dispatchEvent(){}};
 const store={'ordenz-country':country};
 vm.runInNewContext(fs.readFileSync(new URL('../src/assets/country.js',import.meta.url),'utf8'),{window:{},document:doc,location:{pathname:'/support/'},localStorage:{getItem:k=>store[k]??null,setItem(k,v){store[k]=v}},Intl,CustomEvent:class{constructor(t,d){this.type=t;this.detail=d?.detail}}});
 return links.map(x=>x.l.h);
}
test('choosing Malaysia switches every WhatsApp link to the Malaysia number, India keeps the India one',()=>{
 assert.deepEqual(run('MY'),['https://wa.me/601116441186?text=Hi','https://wa.me/601116441186']);
 assert.deepEqual(run('IN'),['https://wa.me/917358507977?text=Hi','https://wa.me/917358507977']);
});
