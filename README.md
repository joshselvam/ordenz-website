# OrdenZ website

The company website: OrdenZ home page, the OrdenZ product page, the OrdenZ live demo,
the privacy policy and the delete-account page. Plain HTML and CSS, built by a tiny script with no dependencies.

```
ordenz-website/
├── site.config.json   ← company name, contact email, WhatsApp, prices, Play Store link, site address
├── build.mjs          builds everything into dist
└── src/               pages, shared header/footer, styles, images and logos
```

The live demo page (`/demo/`) opens the real OrdenZ app on the demo server set in `demoUrl`, as any role (owner, manager, cashier, captain, chef, store keeper, cleaning, kiosk, token TV). That server runs with `DEMO_PUBLIC=true` and `DEMO_LIVE=true`, so its data is live and it's rebuilt every night; see "Public live demo server" in the OrdenZ README. Each push to the OrdenZ repo redeploys it, so the demo always has the latest features.

The offline sample (`/demo/preview/`) is `src/demo/index.html`, a limited standalone sample based on `docs/index.html`. It is separate from the current full app. The page explicitly labels its simulated payments, uses the current light workspace palette, and links back to demo options. Shared pages and the sample use a versioned OrdenZ SVG favicon to refresh cached tab icons.

## What's on the site

| Page | Source | What it shows |
|---|---|---|
| Home | `src/index.html` | OrdenZ and its products |
| OrdenZ | `src/features.html` | Features (kiosk in eight languages, voice, UPI, kitchen, printing, offline, recipes & stock, owner dashboard, bulk & catering, TableTurn, team roles, supplier invoices, marketing), plans, FAQ, contact |
| Live demo | `src/demo.html` | Opens the live demo server as any role (or the browser preview until `demoUrl` is set) |
| Browser preview | `src/demo/index.html` | The server-free kiosk and counter preview, copied from `docs/index.html` in the OrdenZ repo |
| Guide | `src/help.html` | Step-by-step help with pictures, filtered by role and searchable. Update it with every new feature |
| Privacy | `src/privacy.html` | What the app handles, including item photos and bulk-order customer details. Update the "Last updated" date when it changes |
| Delete account | `src/delete-account.html` | The Play Store account-deletion page |

Keep the OrdenZ page in step with the app: the trial is 30 days of Pro from the first real bill; Starter adds bulk & catering orders; Pro adds voice/AI ordering, unlimited devices and managing the cafe from any browser. Country prices come from `pricing.IN` and `pricing.MY` in `site.config.json`. India values match the app; Malaysia list prices are confirmed and settled by invoice.

Images in `src/assets/img/` include real app screenshots and `botanical-cafe.webp`, a decorative illustration. The Indie Botanical design uses ivory paper, emerald serif headings, sage foliage, terracotta accents and collage layers. Actual app screenshots sit above the artwork as responsive HTML images; links and controls remain native HTML. All public navigation links stay available on small screens.

Build with `node build.mjs`, then preview at `http://localhost:8088` using the app repository's local Docker overlay. These changes do not publish the website or the Android app.

## Change the details

Edit `site.config.json` and push. Empty settings are left out of the pages.

| Setting | What it changes |
|---|---|
| `email`, `whatsapp` | Contact buttons and the privacy / delete-account pages |
| `pricing.IN`, `pricing.MY` | Monthly and annual plan amounts, currency, locale and display status for each country |
| `playUrl` | Shows a "Get it on Google Play" button once the app is live |
| `appUrl` | Your OrdenZ server address, for "Sign in" and the in-app delete page |
| `demoUrl` | The live demo server, for example `https://demo.ordenz.com`. Empty: the demo page sends visitors to the browser preview |
| `siteUrl` | The site's address (used for search engines and link previews) |
| `legalName` | Who is responsible in the privacy policy. Change to the registered company name when you have it |

## Preview on your computer

```bash
node build.mjs
npx serve dist        # or open dist/index.html
```

## Publish free on Cloudflare

1. Create a free account at <https://dash.cloudflare.com>.
2. Go to **Compute → Workers & Pages → Create application → Import a repository**, and pick `ordenz-website` (private repos are fine).
3. Use these settings:
   - Project name: `www` (must match `"name"` in `wrangler.jsonc`)
   - Build command: `node build.mjs`
   - Deploy command: `npx wrangler deploy`
4. Click **Deploy**. The site goes live at `https://www.<your-subdomain>.workers.dev`. Put that address in `siteUrl` in `site.config.json`.
5. Every push to `main` rebuilds the site automatically.

`wrangler.jsonc` tells Cloudflare to serve the built `dist` folder as a static site, with `_headers`, `_redirects` and the 404 page.

**Add your own domain later** (e.g. `ordenz.in`): go to the Pages project → **Custom domains → Set up a domain**, and follow the steps. Then update `siteUrl` in `site.config.json`.

**Google Play links** once it's live:
- Privacy policy: `https://www.ordenz.com/privacy/`
- Account deletion: `https://www.ordenz.com/delete-account/`

## Cafe Crest brand refresh — 26 October 2026

The selected Cafe Crest replaces the earlier OZ cup mark in the header, footer, product icon, favicons and wordmarks. Brand SVG files embed a compressed raster rendition of the approved master; they are not editable vector illustrations. Social preview art is `src/assets/og.jpg`. Full master and image-generation source stay in the app repository. Rebuild locally with `node build.mjs`. The matching media package lives under `../Social Media/OrdenZ Cafe Crest Package 2026-10-26`. No public deployment is performed by this refresh.

## Regional pricing tabs — 27 October 2026

`site.config.json` → `pricing` is the display data for the India and Malaysia panels. `pricing.mjs` validates and renders accessible server-built cards; `src/assets/pricing.js` switches country and billing cycle without contacting payment services. India values match the current app billing constants. MYR list prices are settled by invoice; online MYR subscription checkout is not enabled. Do not publish a quote as a guaranteed checkout price without matching billing configuration, regional readiness, tax/support terms and approval.

Build: `node build.mjs`. Unit checks: `node --test test/pricing.test.mjs`. Local responsive/keyboard/no-JS tests and India billing-parity assertions: run the app repository’s `server/scripts/website-pricing-qa.mjs` with the local site at port 8088.

The legacy `priceStarter` and `pricePro` strings are no longer used by the regional pricing renderer. No backend subscriptions or customer prices were changed.

## Website content review — 27 October 2026

Reviewed StoreHub's homepage and F&B page (https://www.storehub.com/ and https://www.storehub.com/fb) for buying-journey structure. The OrdenZ homepage now focuses on cafe/bakery, quick-service and catering workflows, a three-stage service journey, and a prepare/practise/decide pilot checklist. The existing Cafe Crest / Indie Botanical design and regional pricing remain.

Product FAQs explain migration limits, configured services, third-party costs, hardware checks and demo availability. Manual Malaysian DuitNow recording is distinguished from automatic payment integration; menu screenshot import is distinguished from live aggregator intake. No customer counts, testimonials, uptime guarantees or support SLA were invented. Collect consented pilot stories and measured results before adding social proof.

Built since: table QR ordering, split and multiple-payment bills, day-end cash closing, delivery-app orders with payouts, Tally export, an all-outlets view and Malaysian e-invoice files (prepared, not submitted). Still pending: live delivery-platform order intake and automatic DuitNow payments.

## Regional price update — 28 October 2026

India Starter: ₹987 monthly / ₹9,870 yearly; Pro: ₹1,987 monthly / ₹19,870 yearly. Malaysia Starter: RM97 monthly / RM970 yearly; Pro: RM197 monthly / RM1,970 yearly. Annual prices equal ten monthly payments. The app's regional defaults match this configuration. Approved public catalog versions override website defaults; client-specific bundles and existing agreements are excluded from the public feed. India provider plan amounts must match before checkout; Malaysia remains invoiced. Deployment is required for these source changes to appear online.
