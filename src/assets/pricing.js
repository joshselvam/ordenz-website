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
