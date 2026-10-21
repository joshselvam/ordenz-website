# StarNest website

The company website: StarNest home page, the OrderNest product page, the OrderNest live demo,
the privacy policy and the delete-account page. Plain HTML and CSS, built by a tiny script with no dependencies.

```
starnest-website/
├── site.config.json   ← company name, contact email, WhatsApp, prices, Play Store link, site address
├── build.mjs          builds everything into dist
└── src/               pages, shared header/footer, styles, images and logos
```

The live demo page (`/ordernest/demo/`) opens the real OrderNest app on the demo server set in `demoUrl`, as any role (owner, manager, cashier, captain, chef, store keeper, cleaning, kiosk, token TV). That server runs with `DEMO_PUBLIC=true` and `DEMO_LIVE=true`, so its data is live and it's rebuilt every night; see "Public live demo server" in the OrderNest README. Each push to the OrderNest repo redeploys it, so the demo always has the latest features.

The quick browser preview (`/ordernest/demo/preview/`) is `src/demo/index.html`, a copy of `docs/index.html` from the OrderNest repo that runs without a server.

## What's on the site

| Page | Source | What it shows |
|---|---|---|
| Home | `src/index.html` | StarNest and its products |
| OrderNest | `src/ordernest.html` | Features (kiosk in six languages, voice, UPI, kitchen, printing, offline, recipes & stock, owner dashboard, bulk & catering, TableTurn, team roles, supplier invoices, marketing), plans, FAQ, contact |
| Live demo | `src/demo-live.html` | Opens the live demo server as any role (or the browser preview until `demoUrl` is set) |
| Browser preview | `src/demo/index.html` | The server-free kiosk and counter preview, copied from `docs/index.html` in the OrderNest repo |
| Guide | `src/help.html` | Step-by-step help with pictures, filtered by role and searchable. Update it with every new feature |
| Privacy | `src/privacy.html` | What the app handles, including item photos and bulk-order customer details. Update the "Last updated" date when it changes |
| Delete account | `src/delete-account.html` | The Play Store account-deletion page |

Keep the OrderNest page in step with the app: the trial is 30 days of Pro from the first real bill; Starter adds bulk & catering orders; Pro adds voice/AI ordering, unlimited devices and managing the cafe from any browser. Prices come from `priceStarter` and `pricePro` (the app charges ₹999 and ₹1,999 a month).

Images in `src/assets/img/` are 1440 × 810 WebP screenshots of the app.

## Change the details

Edit `site.config.json` and push. Empty settings are left out of the pages.

| Setting | What it changes |
|---|---|
| `email`, `whatsapp` | Contact buttons and the privacy / delete-account pages |
| `priceStarter`, `pricePro` | Prices on the OrderNest page, for example `"₹499 / month"`. Empty shows "Ask us" |
| `playUrl` | Shows a "Get it on Google Play" button once the app is live |
| `appUrl` | Your OrderNest server address, for "Sign in" and the in-app delete page |
| `demoUrl` | The live demo server, for example `https://ordernest-demo.onrender.com`. Empty: the demo page sends visitors to the browser preview |
| `siteUrl` | The site's address (used for search engines and link previews) |
| `legalName` | Who is responsible in the privacy policy. Change to the registered company name when you have it |

## Preview on your computer

```bash
node build.mjs
npx serve dist        # or open dist/index.html
```

## Publish free on Cloudflare

1. Create a free account at <https://dash.cloudflare.com>.
2. Go to **Compute → Workers & Pages → Create application → Import a repository**, and pick `starnest-website` (private repos are fine).
3. Use these settings:
   - Project name: `www` (must match `"name"` in `wrangler.jsonc`)
   - Build command: `node build.mjs`
   - Deploy command: `npx wrangler deploy`
4. Click **Deploy**. The site goes live at `https://www.<your-subdomain>.workers.dev`. Put that address in `siteUrl` in `site.config.json`.
5. Every push to `main` rebuilds the site automatically.

`wrangler.jsonc` tells Cloudflare to serve the built `dist` folder as a static site, with `_headers`, `_redirects` and the 404 page.

**Add your own domain later** (e.g. `starnest.in`): go to the Pages project → **Custom domains → Set up a domain**, and follow the steps. Then update `siteUrl` in `site.config.json`.

**Google Play links** once it's live:
- Privacy policy: `https://www.starnest.workers.dev/privacy/`
- Account deletion: `https://www.starnest.workers.dev/delete-account/`
