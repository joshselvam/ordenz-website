// Builds the StarNest website into dist (no dependencies, Node 18+).
//   node build.mjs
// Cloudflare Pages: build command "node build.mjs", output directory "dist".
//
// Pages live in src/*.html. In them:
//   {{key}}               value from site.config.json (HTML-escaped)
//   {{> header}}          include src/_partials/header.html (same for footer)
//   {{#if key}}…{{/if}}   keep the block only when the setting has a value
//   {{#unless key}}…{{/unless}}  keep it only when the setting is empty
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "src");
const out = path.join(here, "dist");
const cfg = JSON.parse(fs.readFileSync(path.join(here, "site.config.json"), "utf8"));
cfg.siteUrl = String(cfg.siteUrl || "").replace(/\/+$/, "");
cfg.emailOrWhatsapp = cfg.email || cfg.whatsapp;
cfg.waLink = cfg.whatsapp ? `https://wa.me/${String(cfg.whatsapp).replace(/\D/g, "")}` : "";
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

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Pages: src/<name>.html  ->  dist/<name>/index.html  (index.html and 404.html stay at the root)
const pages = [
  { file: "index.html", out: "index.html", path: "/", title: `${cfg.company}: ${cfg.tagline}`, desc: `${cfg.company} builds affordable apps for cafes, shops and small businesses in India, starting with OrderNest.` },
  { file: "ordernest.html", out: "ordernest/index.html", path: "/ordernest/", title: "OrderNest: self-order kiosk & POS for cafes", desc: "Cafe kiosk and POS in six Indian languages with voice ordering, UPI, GST billing, offline sales, team roles, supplier invoices, table booking, loyalty and offers." },
  { file: "demo-live.html", out: "ordernest/demo/index.html", path: "/ordernest/demo/", title: "OrderNest live demo", desc: "Open the real OrderNest app with a sample cafe running live: kiosk, owner, cashier, chef, captain, store keeper and the token TV." },
  { file: "help.html", out: "ordernest/help/index.html", path: "/ordernest/help/", title: "OrderNest guide", desc: "Step-by-step guide to OrderNest with pictures: setting up, the kiosk, counter, kitchen, tables, stock, suppliers, team roles and reports." },
  { file: "privacy.html", out: "privacy/index.html", path: "/privacy/", title: "Privacy policy", desc: "What OrderNest handles, why, and who sees it." },
  { file: "delete-account.html", out: "delete-account/index.html", path: "/delete-account/", title: "Delete your account", desc: "How to delete your OrderNest cafe account and data." },
  { file: "404.html", out: "404.html", path: "/404", title: "Page not found", desc: "" },
];
for (const p of pages) {
  const html = render(fs.readFileSync(path.join(src, p.file), "utf8"), { pageTitle: p.title, pageDesc: p.desc, pagePath: p.path, canonical: cfg.siteUrl + p.path });
  fs.mkdirSync(path.dirname(path.join(out, p.out)), { recursive: true });
  fs.writeFileSync(path.join(out, p.out), html);
}

copyDir(path.join(src, "assets"), path.join(out, "assets"));
for (const f of ["_headers", "_redirects", "robots.txt"]) fs.writeFileSync(path.join(out, f), render(fs.readFileSync(path.join(src, f), "utf8"), {}));
fs.writeFileSync(path.join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => p.path !== "/404").map((p) => `  <url><loc>${cfg.siteUrl}${p.path}</loc></url>`).join("\n")}
</urlset>
`);

// The quick browser preview (runs without a server): src/demo/index.html, a copy of docs/index.html from the OrderNest repo.
// The live demo page (/ordernest/demo/) links to the real app on the demo server set in "demoUrl".
const demo = path.join(src, "demo", "index.html");
if (fs.existsSync(demo)) {
  fs.mkdirSync(path.join(out, "ordernest", "demo", "preview"), { recursive: true });
  fs.copyFileSync(demo, path.join(out, "ordernest", "demo", "preview", "index.html"));
}

const warn = [];
if (!cfg.email && !cfg.whatsapp) warn.push("No contact email or WhatsApp number yet: set \"email\" or \"whatsapp\" in site.config.json");
if (!cfg.demoUrl) warn.push("No live demo server yet: set \"demoUrl\" in site.config.json (the demo page shows the browser preview until then)");
if (!cfg.playUrl) warn.push("No Google Play link yet: the OrderNest page shows \"Book a demo\" instead of the Play badge");
warn.forEach((w) => console.warn("note:", w));
console.log(`Built ${pages.length} pages into dist`);
