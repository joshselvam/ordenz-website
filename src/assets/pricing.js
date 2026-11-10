// Pricing display only. Does not create subscriptions or change application prices.
const root=document.getElementById('pricing');
if(root){
 const tabs=[...root.querySelectorAll('[data-region]')];
 function choose(button,focus=false){
  for(const tab of tabs){const on=tab===button;tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!on;}
  if(focus)button.focus();
 }
 for(const tab of tabs){tab.addEventListener('click',()=>choose(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=tabs[(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length];if(event.key==='Home')next=tabs[0];if(event.key==='End')next=tabs.at(-1);if(next){event.preventDefault();choose(next,true);}});}
 const countryOf=()=>window.OrdenzCountry?window.OrdenzCountry.get():document.documentElement.dataset.country;
 const applyCountry=code=>{const tab=root.querySelector('[data-region="'+(code==='IN'?'IN':'MY')+'"]');if(tab)choose(tab)};
 applyCountry(countryOf());
 document.addEventListener('ordenz-country',event=>applyCountry(event.detail.country));
 for(const button of root.querySelectorAll('[data-cycle]'))button.addEventListener('click',()=>{
  const yearly=button.dataset.cycle==='annual';for(const b of root.querySelectorAll('[data-cycle]'))b.setAttribute('aria-pressed',String(b===button));
  for(const el of root.querySelectorAll('[data-price-monthly]'))el.hidden=yearly;
  for(const el of root.querySelectorAll('[data-price-annual]'))el.hidden=!yearly;
  for(const el of root.querySelectorAll('[data-cycle-label]'))el.textContent=yearly?' / year':' / month';
 });
}

// Read approved public prices only. Private client bundles and provider secrets are never exposed.
if(root?.dataset.pricingApi){fetch(root.dataset.pricingApi,{credentials:'omit',signal:AbortSignal.timeout(5000)}).then(r=>{if(!r.ok)throw Error('Pricing unavailable');return r.json()}).then(data=>{
 for(const region of ['IN','MY']){const info=data.regions?.[region],panel=document.getElementById('pricing-'+region);if(!info||!panel)continue;
 // Update list prices and plan names only. Keep the SSR feature bullets from pricing.mjs
 // (BILLING_PLANS wording). Do not rebuild the list from catalog modules — that replaced
 // "Unlimited devices" with "999 devices" and dropped Pro marketing lines.
 let updated=0;for(const tier of ['starter','pro']){const plan=info.plans?.[tier],card=panel.querySelector('[data-plan="'+tier+'"]');if(!card)continue;if(!plan){card.querySelector('[data-price-monthly]').textContent='On request';card.querySelector('[data-price-annual]').textContent='On request';continue}if(!Number.isSafeInteger(plan.monthlyMinor)||!Number.isSafeInteger(plan.annualMinor))continue;const money=n=>new Intl.NumberFormat(region==='MY'?'en-MY':'en-IN',{style:'currency',currency:info.currency}).format(n/100);card.querySelector('h3').textContent=plan.label;card.querySelector('[data-price-monthly]').textContent=money(plan.monthlyMinor);card.querySelector('[data-price-annual]').textContent=money(plan.annualMinor);updated++}
 {const status=panel.querySelector('.pricing-status');
  const refresh=updated===2?'Current approved public list prices':updated?'Published prices shown where available; other plans need a quote.':'Contact OrdenZ for a current quote';
  // Keep MY SSR tax status (excl. SST) — do not wipe it with generic refresh copy.
  if(status){const prior=status.textContent.trim();status.textContent=(region==='MY'&&/excl\.?\s*SST/i.test(prior)&&!/excl\.?\s*SST/i.test(refresh))?(prior+' · '+refresh):refresh;}
  // Keep SSR legal/onboarding copy in .pricing-notice (MyInvois, DuitNow, India disclaimers).
  // Only prepend API notes when present; never replace the whole paragraph.
  const notice=panel.querySelector('.pricing-notice');
  if(notice&&data.notes){const body=notice.textContent.trim();if(!body.startsWith(data.notes))notice.textContent=data.notes+(body?' '+body:'');}
 }
 }
}).catch(()=>{for(const panel of root.querySelectorAll('.pricing-panel')){const status=panel.querySelector('.pricing-status');if(status)status.textContent+=' · verify the current quote with OrdenZ'}})}
