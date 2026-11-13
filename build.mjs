// Builds the OrdenZ website into dist (no dependencies, Node 18+).
//   node build.mjs
// Cloudflare Pages: build command "node build.mjs", output directory "dist".
//
// Pages live in src/*.html. In them:
//   {{key}}               value from site.config.json (HTML-escaped)
//   {{> header}}          include src/_partials/header.html (same for footer)
//   {{#if key}}…{{/if}}   keep the block only when the setting has a value
//   {{#unless key}}…{{/unless}}  keep it only when the setting is empty
import fs from "node:fs";
import crypto from "node:crypto";
import {renderPricing} from "./pricing.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "src");
const out = path.join(here, "dist");
const cfg = JSON.parse(fs.readFileSync(path.join(here, "site.config.json"), "utf8"));
cfg.siteUrl = String(process.env.SITE_URL || cfg.siteUrl || "").replace(/\/+$/, "");
if (!cfg.siteUrl) throw new Error("Set siteUrl in site.config.json (or SITE_URL) so canonical links, the sitemap and share images use the real address");
const pricingApp=new URL(cfg.appUrl||'https://app.ordenz.com');if(pricingApp.protocol!=='https:'&&!(pricingApp.protocol==='http:'&&['localhost','127.0.0.1'].includes(pricingApp.hostname)))throw Error('Use an HTTPS app URL for public pricing');cfg.appOrigin=pricingApp.origin;
cfg.emailOrWhatsapp = cfg.email || cfg.whatsapp;
// WhatsApp per country: "whatsapp" is India (and the default), "whatsappMY" is Malaysia. country.js swaps the
// number in every wa.me link when the visitor picks Malaysia; without JavaScript the India number shows.
const waDigits = (v) => String(v || "").replace(/\D/g, "");
for (const [key, v] of [["whatsapp", cfg.whatsapp], ["whatsappMY", cfg.whatsappMY]]) {
  if (v && !/^\d{8,15}$/.test(waDigits(v))) throw new Error(`${key} must be a phone number with the country code (8-15 digits)`);
}
cfg.waNumberIN = waDigits(cfg.whatsapp);
cfg.waNumberMY = waDigits(cfg.whatsappMY) || cfg.waNumberIN;
cfg.waLink = cfg.whatsapp ? `https://wa.me/${cfg.waNumberIN}` : "";
cfg.contactLink = cfg.email ? `mailto:${cfg.email}` : cfg.waLink || "#contact";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const partial = (name) => fs.readFileSync(path.join(src, "_partials", name + ".html"), "utf8");

function render(html, page) {
  const vars = { ...cfg, ...page };
  for (let i = 0; i < 3; i++) html = html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partial(n));
  html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, k, body) => (vars[k] ? body : ""));
  html = html.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, k, body) => (vars[k] ? "" : body));
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => esc(vars[k] ?? ""));
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

// Retry: parallel tests each call build.mjs and can race on Windows/CI clearing dist.
for (let i = 0; ; i++) {
  try {
    fs.rmSync(out, { recursive: true, force: true });
    break;
  } catch (e) {
    if (i >= 8) throw e;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40 * (i + 1));
  }
}
fs.mkdirSync(out, { recursive: true });

// Pages: src/<name>.html  ->  dist/<name>/index.html  (index.html and 404.html stay at the root)
const pages = [
  { file: "index.html", out: "index.html", path: "/", title: "Cafe POS for India and Malaysia | OrdenZ", desc: "OrdenZ is a cafe POS with a self-order kiosk and a kitchen screen for small cafes in India and Malaysia." },
  { file: "features.html", out: "features/index.html", path: "/features/", title: "Cafe POS and self-order kiosk features | OrdenZ", desc: "OrdenZ is a cafe POS with a self-order kiosk, counter, kitchen, stock and reports for small cafes in India and Malaysia." },
  { file: "demo.html", out: "demo/index.html", path: "/demo/", title: cfg.demoUrl ? "Cafe POS live demo | OrdenZ" : "Cafe POS demo (browser preview) | OrdenZ", desc: cfg.demoUrl ? "Explore real cafe workflows with an isolated sample account and role-specific screens." : "Try a limited kiosk, counter, kitchen and token browser preview with simulated payments." },
  { file: "help.html", out: "guide/index.html", path: "/guide/", title: "OrdenZ cafe POS guide", desc: "Step-by-step guide to OrdenZ with pictures: setting up, the kiosk, counter, kitchen, tables, stock, suppliers, team roles and reports." },
  { file: "start-a-cafe.html", out: "start-a-cafe/index.html", path: "/start-a-cafe/", title: "Start a cafe in India or Malaysia: licences, tax and equipment", desc: "A plain guide to opening a cafe: FSSAI, GST and trade licences in India; SSM, council licence, food handler course and SST in Malaysia; equipment, menu pricing and your first week." },
  { file: "terms.html", out: "terms/index.html", path: "/terms/", title: "Terms of service", desc: "The agreement between your cafe and OrdenZ: plans, payments, your data and your responsibilities." },
  { file: "support.html", out: "support/index.html", path: "/support/", title: "Help and support", desc: "How to reach the OrdenZ team: the Feedback button in the app, email, reply times and what to do if the internet is down." },
  { file: "privacy.html", out: "privacy/index.html", path: "/privacy/", title: "Privacy policy", desc: "What OrdenZ handles, why, and who sees it." },
  { file: "delete-account.html", out: "delete-account/index.html", path: "/delete-account/", title: "Delete your account", desc: "How to delete your OrdenZ cafe account and data." },
  { file: "404.html", out: "404.html", path: "/404", title: "Page not found", desc: "" },
];
function stripTags(s) {
  return String(s)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function siteJsonLd() {
  const org = {
    "@type": "Organization",
    "name": cfg.company,
    "url": cfg.siteUrl,
    "legalName": cfg.legalName,
    ...(cfg.legalRegistration ? { "identifier": cfg.legalRegistration } : {}),
    "areaServed": ["IN", "MY"],
  };
  if (cfg.email) org.email = cfg.email;
  if (cfg.waLink) org.sameAs = [cfg.waLink];
  return {
    "@context": "https://schema.org",
    "@graph": [
      org,
      {
        "@type": "SoftwareApplication",
        "name": cfg.company,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Android, Web",
        "url": cfg.siteUrl,
        "description": "Cafe POS with a self-order kiosk and a kitchen screen for small cafes in India and Malaysia.",
      },
    ],
  };
}

function faqJsonLd(html) {
  const mainEntity = [];
  for (const m of html.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/gi)) {
    const name = stripTags(m[1]);
    const text = stripTags(m[2]);
    if (name && text) mainEntity.push({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } });
  }
  if (!mainEntity.length) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity };
}

function withJsonLd(html, extra) {
  const blocks = [`<script type="application/ld+json">${JSON.stringify(siteJsonLd())}</script>`];
  if (extra) blocks.push(`<script type="application/ld+json">${JSON.stringify(extra)}</script>`);
  return html.replace("</head>", `${blocks.join("\n")}\n</head>`);
}

// Inline scripts allowed by the Content-Security-Policy (see src/_headers): collected from the built pages
const inlineScripts = new Set();
const collectScripts = (html) => { for (const m of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) if (m[1].trim()) inlineScripts.add(m[1].replace(/\r\n?/g,"\n")); };
for (const p of pages) {
  const source=fs.readFileSync(path.join(src,p.file),"utf8")
    .replace(/<!-- LIVE_DEMO_ONLY_START -->([\s\S]*?)<!-- LIVE_DEMO_ONLY_END -->/g, (_,body)=>cfg.demoUrl?body:"")
    .replace("<!-- REGIONAL_PRICING -->",renderPricing(cfg.pricing,cfg.contactLink,cfg.appUrl));
  let html = render(source, { pageTitle: p.title, pageDesc: p.desc, pagePath: p.path, canonical: cfg.siteUrl + p.path });
  const faq = (p.file === "features.html" || p.file === "start-a-cafe.html") ? faqJsonLd(html) : null;
  html = withJsonLd(html, faq);
  fs.mkdirSync(path.dirname(path.join(out, p.out)), { recursive: true });
  fs.writeFileSync(path.join(out, p.out), html);
  collectScripts(html);
}
const demo = path.join(src, "demo", "index.html");
if (fs.existsSync(demo)) collectScripts(fs.readFileSync(demo, "utf8"));
cfg.cspScriptHashes = [...inlineScripts].map((s) => `'sha256-${crypto.createHash("sha256").update(s).digest("base64")}'`).join(" ");

copyDir(path.join(src, "assets"), path.join(out, "assets"));
for (const f of ["_headers", "_redirects", "robots.txt"]) fs.writeFileSync(path.join(out, f), render(fs.readFileSync(path.join(src, f), "utf8"), {}).replace(/&#39;|&apos;/g, "'"));
fs.writeFileSync(path.join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => p.path !== "/404").map((p) => `  <url><loc>${cfg.siteUrl}${p.path}</loc></url>`).join("\n")}
</urlset>
`);

// The quick browser preview (runs without a server): src/demo/index.html, a copy of docs/index.html from the OrdenZ repo.
// The live demo page (/demo/) links to the real app on the demo server set in "demoUrl".
if (fs.existsSync(demo)) {
  fs.mkdirSync(path.join(out, "demo", "preview"), { recursive: true });
  fs.copyFileSync(demo, path.join(out, "demo", "preview", "index.html"));
}

const warn = [];
if (!cfg.email && !cfg.whatsapp) warn.push("No contact email or WhatsApp number yet: set \"email\" or \"whatsapp\" in site.config.json");
if (!cfg.demoUrl) warn.push("No live demo server yet: set \"demoUrl\" in site.config.json (the demo page shows the browser preview until then)");
if (cfg.playUrl && !/^https:\/\/play\.google\.com\/store\/apps\/details\?id=[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(cfg.playUrl)) throw new Error("playUrl must be a Google Play app link: https://play.google.com/store/apps/details?id=<package>");
if (!cfg.playUrl) warn.push("No Google Play link yet: the OrdenZ page shows \"Book a demo\" instead of the Play badge");
warn.forEach((w) => console.warn("note:", w));
console.log(`Built ${pages.length} pages into dist`);
