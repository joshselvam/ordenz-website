// Pricing display only. Does not create subscriptions or change application prices.
const root=document.getElementById('pricing');
if(root){
 const tabs=[...root.querySelectorAll('[data-region]')];
 function choose(button,focus=false){
  for(const tab of tabs){const on=tab===button;tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!on;}
  if(focus)button.focus();
 }
 for(const tab of tabs){tab.addEventListener('click',()=>choose(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=tabs[(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length];if(event.key==='Home')next=tabs[0];if(event.key==='End')next=tabs.at(-1);if(next){event.preventDefault();choose(next,true);}});}
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
 let updated=0;for(const tier of ['starter','pro']){const plan=info.plans?.[tier],card=panel.querySelector('[data-plan="'+tier+'"]');if(!card)continue;if(!plan){card.querySelector('[data-price-monthly]').textContent='On request';card.querySelector('[data-price-annual]').textContent='On request';continue}if(!Number.isSafeInteger(plan.monthlyMinor)||!Number.isSafeInteger(plan.annualMinor))continue;const money=n=>new Intl.NumberFormat(region==='MY'?'en-MY':'en-IN',{style:'currency',currency:info.currency}).format(n/100);card.querySelector('h3').textContent=plan.label;card.querySelector('[data-price-monthly]').textContent=money(plan.monthlyMinor);card.querySelector('[data-price-annual]').textContent=money(plan.annualMinor);if(plan.modules){const ul=card.querySelector('ul');ul.replaceChildren();const device=document.createElement('li');device.textContent=plan.deviceLimit+' devices';ul.append(device);for(const item of Object.values(plan.modules))if(item.included){const li=document.createElement('li');li.textContent=item.label;ul.append(li)}}updated++}
 {panel.querySelector('.pricing-status').textContent=updated===2?'Current approved public list prices':updated?'Published prices shown where available; other plans need a quote.':'Contact OrdenZ for a current quote';panel.querySelector('.pricing-notice').textContent=data.notes+' '+(region==='MY'?'Malaysia access is agreed and settled through an invoice; online subscription checkout is not currently available.':'')}
 }
}).catch(()=>{for(const panel of root.querySelectorAll('.pricing-panel')){const status=panel.querySelector('.pricing-status');if(status)status.textContent+=' · verify the current quote with OrdenZ'}})}
