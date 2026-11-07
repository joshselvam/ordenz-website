import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {renderPricing} from '../pricing.mjs';
const pricing=JSON.parse(fs.readFileSync(new URL('../site.config.json',import.meta.url))).pricing;
test('India and Malaysia panels expose all prices with explicit invoice status',()=>{const h=renderPricing(pricing,'mailto:owner@example.invalid');assert.match(h,/role="tablist"/);assert.match(h,/id="pricing-IN"/);assert.match(h,/id="pricing-MY"/);assert.equal((h.match(/class="card plan/g)||[]).length,6);assert.match(h,/987/);assert.match(h,/1,987/);assert.match(h,/9,870/);assert.match(h,/19,870/);assert.match(h,/RM/);assert.match(h,/not an active online subscription offer/);assert.match(h,/prepares MyInvois e-invoice files/);assert.match(h,/DuitNow QR availability depends on an approved supported merchant connection/);});
test('region and currency mismatch or invalid amounts cannot be published',()=>{const p=structuredClone(pricing);p.MY.currency='INR';assert.throws(()=>renderPricing(p,'#contact'));p.MY.currency='MYR';p.MY.monthly.pro=-1;assert.throws(()=>renderPricing(p,'#contact'));});
test('contact links and text are escaped; non-mail links are preserved',()=>{const h=renderPricing(pricing,'#contact');assert.match(h,/href="#contact"/);assert.ok(!h.includes('#contact?subject'));const p=structuredClone(pricing);p.MY.status='<script>bad</script>';assert.ok(!renderPricing(p,'#contact').includes('<script>bad'));});

test('public price refresh uses the configured app and identifies plans without exposing private account data',()=>{const html=renderPricing(pricing,'#contact','https://app.example.invalid');assert.match(html,/data-pricing-api="https:\/\/app.example.invalid\/api\/plans\/public"/);assert.equal((html.match(/data-plan="starter"/g)||[]).length,2);});

test('regional annual prices equal ten monthly payments',()=>{for(const region of ['IN','MY'])for(const tier of ['starter','pro'])assert.equal(pricing[region].annual[tier],pricing[region].monthly[tier]*10);assert.equal(pricing.MY.monthly.starter,97);assert.equal(pricing.MY.monthly.pro,197);});
test('yearly copy says 12 for the price of 10 (two months free)',()=>{const h=renderPricing(pricing,'#contact');assert.match(h,/pricing-cycle-note/);assert.match(h,/12 months for the price of 10 \(two months free\)/);assert.match(h,/Yearly = 12 months for the price of 10/);assert.match(h,/equal ten monthly payments/);});
test('paid extras stay snack prices, not a fourth plan',()=>{const h=renderPricing(pricing,'#contact');assert.match(h,/₹490 \/ RM49 a year/);assert.match(h,/billed yearly only/);assert.match(h,/not a fourth plan/);assert.match(h,/Starter and Pro stay the plans/);assert.match(h,/Voice &amp; AI, Recipes, Intake, Bulk, TableTurn, table QR, pickup, day book\/Tally and browser management sit on Pro \(Request from Plan\)/);assert.match(h,/Printed receipts, kiosk, kitchen and token screen/);assert.match(h,/Pickup slots/);assert.doesNotMatch(h,/Table QR is on Starter and Pro/);assert.doesNotMatch(h,/₹49 \/ RM4\.90 a month/);assert.doesNotMatch(h,/Linked outlets \(up to 50\)/);assert.doesNotMatch(h,/Malaysia e-invoice ZIP via your provider/);});
test('Pro cards show Recommended and Pro-gated modules match the app',()=>{const h=renderPricing(pricing,'#contact');assert.equal((h.match(/class="plan-flag"/g)||[]).length,2);assert.match(h,/>Recommended</);assert.match(h,/Recipes, batch prep and costing/);assert.match(h,/Unlimited devices/);assert.match(h,/Bulk and catering orders/);assert.match(h,/Day book, GST\/SST working sheet and Tally import/);assert.match(h,/Supplier invoices and wastage/);assert.match(h,/Requested one-by-one from Plan/);assert.doesNotMatch(h,/Starter adds bulk/);assert.doesNotMatch(h,/999 devices/);
  // Slim Starter must not market Pro-only tools as included.
  const starters=[...h.matchAll(/<article data-plan="starter"[\s\S]*?<\/article>/g)].map(m=>m[0]);
  assert.equal(starters.length,2);
  for(const card of starters){
    assert.doesNotMatch(card,/Recipes, batch prep/);
    assert.doesNotMatch(card,/Bulk and catering/);
    assert.doesNotMatch(card,/Table bookings/);
    assert.doesNotMatch(card,/Day book/);
  }
});
test('live price refresh updates amounts only and does not rebuild feature lists from catalog modules',()=>{
  const js=fs.readFileSync(new URL('../src/assets/pricing.js',import.meta.url),'utf8');
  assert.match(js,/data-price-monthly/);
  assert.match(js,/plan\.label/);
  assert.doesNotMatch(js,/replaceChildren/);
  assert.doesNotMatch(js,/deviceLimit\+' devices'/);
  assert.doesNotMatch(js,/Object\.values\(plan\.modules\)/);
});
