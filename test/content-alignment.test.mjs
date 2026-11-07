import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('a preview-only deployment does not promise role-specific live screens',()=>{
 const config=JSON.parse(read('site.config.json'));
 const demo=read('dist/demo/index.html');
 if(!config.demoUrl){
  assert.match(demo,/Cafe POS demo \(browser preview\)/);
  assert.match(demo,/limited preview uses simulated payments/);
  assert.doesNotMatch(demo,/id="roles"|id="tour"|A real cafe, open right now/);
  assert.match(demo,/Book a full walkthrough/);
  assert.match(demo,/>Try demo</);
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
 assert.match(read('src/help.html'),/sold-out items are marked and cannot be added/);
 assert.doesNotMatch(read('src/help.html'),/sold-out items hide from the kiosk/);
 assert.match(features,/Each staff member has their own PIN/);
 assert.match(privacy,/configured AI service may receive your question/);
 assert.match(privacy,/Supported DuitNow QR payments in Malaysia use the cafe's approved Fiuu merchant connection/);
 assert.match(read('src/terms.html'),/supported Fiuu merchant connections/);
 assert.doesNotMatch(features + read('src/index.html'),/Each staff job has its own PIN/);
 assert.match(privacy,/browser’s local storage/);
 assert.match(privacy,/privacy-enhanced player/);
 assert.match(support,/Send feedback in the app/);
 assert.match(support,/cafe code from House/);
});

test('features, guide and demo use shipped tab names from the app',()=>{
 const features=read('src/features.html'),help=read('src/help.html'),demo=read('src/demo.html');
 // Labels must match server/public/js/app.js SCREENS (Brief, Crew desk, Board, House, Intake, Plan, Token screen…).
 const screens=['Brief','Kiosk','Counter','Kitchen','Token screen','Recipes','Stock','Owner','Board','House','Crew desk','Offers','Campaigns','TableTurn','Bulk','Plan','Intake','Cash drawer','Attendance','Reports'];
 for(const page of [features,help]){
  assert.match(page,/Board<\/b> = menu/);
  assert.match(page,/Token screen<\/b> = TV order numbers/);
  assert.doesNotMatch(page,/Recipes &amp; stock|Recipes & stock/);
  assert.doesNotMatch(page,/Stock &amp; suppliers|Stock & suppliers/);
  assert.doesNotMatch(page,/Menu &amp; settings|Menu & settings/);
  assert.doesNotMatch(page,/Open <b>Attendance<\/b> to clock in/);
  assert.doesNotMatch(page,/Cafe settings|Purchases tab|Billing tab|Today tab/);
 }
 for(const label of screens)assert.match(features,new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.match(features,/New → Preparing → Ready → Served/);
 assert.match(features,/Stock &amp; Intake/);
 assert.match(features,/eyebrow">Voice &amp; AI ordering · Pro</);
 assert.match(features,/eyebrow">Marketing · paid extras</);
 assert.match(features,/Voice &amp; AI, Recipes, Intake, Bulk, TableTurn/);
 assert.match(help,/Pro tools \(Voice &amp; AI, Recipes, Intake, Bulk, TableTurn/);
 // Photo/Swiggy menu import is Pro voiceAi, not a yearly paid Marketing add-on.
 {
  const mkt = features.match(/eyebrow">Marketing · paid extras[\s\S]*?<\/ul>/);
  assert.ok(mkt, 'Marketing · paid extras block');
  assert.doesNotMatch(mkt[0], /Import menu items from a photo|Swiggy\/Zomato screenshot/);
  const voice = features.match(/eyebrow">Voice &amp; AI ordering · Pro[\s\S]*?<\/ul>/);
  assert.ok(voice, 'Voice & AI ordering · Pro block');
  assert.match(voice[0], /Import menu items from a photo or a Swiggy\/Zomato screenshot/);
  assert.match(voice[0], /not a paid extra/);
 }
 assert.match(features,/eyebrow">Recipes · Pro</);
 assert.match(features,/eyebrow">Bulk · Pro</);
 assert.match(features,/eyebrow">Intake · Pro</);
 assert.match(features,/eyebrow">Accounts · Pro</);
 assert.match(features,/eyebrow">TableTurn · Pro</);
 assert.match(features,/It does not speak/);
 assert.match(features,/does not open customer-bill\.html/);
 assert.match(help,/It does not speak/);
 assert.match(read('src/index.html'),/second tablet signed in as Guest/);
 assert.match(read('src/index.html'),/It does not speak/);
 assert.match(read('src/index.html'),/not an overlay on the till/);
 // Referral bank matches growth.js: cap 6 unused, 12-month expiry, alternate pay → free.
 assert.match(features,/Up to 6 unused banked credits/);
 assert.match(features,/expire after 12 months/);
 assert.match(features,/alternates pay → free one/);
 assert.match(help,/Up to 6 unused banked credits/);
 assert.match(help,/expire after 12 months/);
 assert.match(help,/alternates pay → free one/);
 assert.doesNotMatch(features,/You get one free month when they make their first real payment<\/li><li>Already paying\? You get a one-month credit instead of extra days/);
 assert.doesNotMatch(help,/you get a free month when they first pay\./);
 assert.match(help,/Ordering from the table \(QR\) — Pro/);
 assert.match(help,/Stock, recipes \(Pro\) and wastage/);
 assert.match(help,/Intake: supplier invoices \(Pro\)/);
 assert.match(help,/Day book exports \(Pro\)/);
 assert.match(help,/Bulk and catering orders — Pro/);
 assert.match(help,/delivery pack — paid extra/);
 assert.match(features,/delivery pack — paid extra/);
 assert.match(features,/On Pro, a QR at the door/);
 assert.doesNotMatch(features,/Bookings and a guest waitlist QR on Starter and Pro/);
 assert.doesNotMatch(help,/Bookings and the waitlist QR are on Starter and Pro/);
 assert.doesNotMatch(read('README.md'),/Starter adds bulk/);
 assert.match(features,/delivery order entry/);
 assert.match(features,/Brief<\/b>, <b>Counter<\/b>, <b>Cash drawer<\/b>, <b>Attendance<\/b>, <b>Crew desk<\/b> and <b>TableTurn<\/b>/);
 assert.match(help,/Clock in on <b>Brief<\/b>/);
 assert.match(help,/Attendance<\/b> to <b>clock out<\/b>/);
 assert.match(help,/Crew desk<\/b> \(managers do not see the Attendance tab\)/);
 assert.match(help,/Board, House, Offers, Campaigns, Kiosk and Token screen/);
 assert.match(help,/Brief, Stock, Intake, Recipes, Bulk and Attendance/);
 assert.match(help,/Staff PINs only work on the cafe's own devices/);
 assert.doesNotMatch(help,/Cafe settings|cafe security/);
 assert.match(features,/only on devices the cafe has set up/);
 assert.match(features,/After staff sign-in, <b>Brief<\/b>/);
 assert.match(features,/Owners use <b>Crew desk<\/b> to manage the team/);
 assert.doesNotMatch(features,/After PIN or email, <b>Brief<\/b>/);
 assert.match(demo,/Open <b>Intake<\/b>/);
 assert.match(demo,/<b>Intake<\/b>, <b>Bulk<\/b>/);
 assert.match(demo,/1 point per RM1/);
 assert.match(features,/Subscribe monthly/);
 assert.match(features,/Request Starter invoice/);
 assert.match(features,/natural voice/);
 assert.match(features,/>Refund</);
 assert.match(help,/Subscribe monthly/);
 assert.match(help,/Subscribe yearly/);
 assert.match(help,/Request Starter invoice/);
 assert.match(help,/Request Pro invoice/);
 assert.match(help,/not labelled Current plan/);
 assert.match(help,/>Refund</);
 assert.match(help,/natural voice/);
 assert.match(help,/language that guest chose on the kiosk/);
 assert.match(features,/language that guest chose on the kiosk/);
 assert.match(help,/1 point per RM1/);
 assert.match(help,/Picture receipts in Hindi, Telugu, Malayalam and Kannada are not available yet/);
 assert.match(features,/Picture receipts in Hindi, Telugu, Malayalam and Kannada are not available yet/);
 assert.doesNotMatch(read('README.md'),/one free month when they first pay\)/);
});

