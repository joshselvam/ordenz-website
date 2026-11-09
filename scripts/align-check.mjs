#!/usr/bin/env node
// Read-only app ↔ website alignment scan (no deploy). Prefer after `node build.mjs`.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(root, "..");
const appRoot = join(siteRoot, "..", "Ordernest-pos-AI");
const issues = [];
const note = (s) => issues.push(s);
const load = (p) => import(pathToFileURL(p).href);
const read = (p) => readFileSync(join(siteRoot, p), "utf8");

const site = JSON.parse(read("site.config.json"));
if (!existsSync(join(appRoot, "server/public/js/plan-prices.js"))) {
  console.error("Sibling app repo missing at ../Ordernest-pos-AI — clone it next to ordenz-website to run align-check.");
  process.exit(2);
}
const { planListPrice } = await load(join(appRoot, "server/public/js/plan-prices.js"));
const { REFERRAL_CREDIT_CAP, REFERRAL_CREDIT_EXPIRY_MONTHS, TRIAL_DAYS, TRIAL_START_WINDOW_DAYS } =
  await load(join(appRoot, "server/src/growth.js"));
const { PAID_ADDON_MODULES } = await load(join(appRoot, "server/src/modules.js"));

const features = read("src/features.html");
const help = read("src/help.html");
const index = read("src/index.html");
const all = features + help + index;

for (const country of ["IN", "MY"]) {
  for (const tier of ["starter", "pro"]) {
    const list = planListPrice(country, tier);
    const majM = list.monthlyMinor / 100;
    const majA = list.annualMinor / 100;
    if (site.pricing[country].monthly[tier] !== majM) note(`C1 ${country} ${tier} monthly: site ${site.pricing[country].monthly[tier]} vs app ${majM}`);
    if (site.pricing[country].annual[tier] !== majA) note(`C1 ${country} ${tier} annual: site ${site.pricing[country].annual[tier]} vs app ${majA}`);
  }
}

if (!all.includes(`${TRIAL_DAYS} days`)) note(`C2 missing ${TRIAL_DAYS} days trial copy`);
if (!all.includes(`day ${TRIAL_START_WINDOW_DAYS}`)) note(`C2 missing day ${TRIAL_START_WINDOW_DAYS} window`);
if (!all.includes("50 orders")) note("C2 missing 50 orders/day Free limit");

if (!features.includes(`Up to ${REFERRAL_CREDIT_CAP} unused`)) note(`Referral cap ${REFERRAL_CREDIT_CAP} missing on features`);
if (!features.includes(`${REFERRAL_CREDIT_EXPIRY_MONTHS} months`)) note(`Referral expiry ${REFERRAL_CREDIT_EXPIRY_MONTHS} months missing`);

if (PAID_ADDON_MODULES.includes("ads")) {
  if (!/yearly Ads add-on|<b>Ads<\/b> yearly add-on|campaigns, Ads,/.test(all)) {
    note("C3 Ads yearly paid add-on missing from website marketing copy");
  }
  if (/Ads on the left if the owner turns them on in House/.test(all)) {
    note("C3 Guest ads still sound like a free House-only toggle");
  }
  if (/House turns Feature ads/.test(all)) {
    note("C3 Guest ads copy must not say House turns Feature ads on (owner must enable the switch)");
  }
}

const distIndex = join(siteRoot, "dist/index.html");
if (existsSync(distIndex)) {
  const built = readFileSync(distIndex, "utf8") + readFileSync(join(siteRoot, "dist/support/index.html"), "utf8");
  if (site.email && !built.includes(site.email)) note(`C4 built pages missing email ${site.email}`);
  const wa = String(site.whatsapp || "").replace(/\D/g, "");
  if (wa && !built.replace(/\D/g, "").includes(wa)) note(`C4 built pages missing WhatsApp ${site.whatsapp}`);
}

console.log(issues.length ? `MISMATCHES (${issues.length}):\n- ${issues.join("\n- ")}` : "No mismatches found by align-check");
process.exit(issues.length ? 1 : 0);
