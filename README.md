# StarNest website

The company website: StarNest home page, the OrderNest product page, the OrderNest live demo,
the privacy policy and the delete-account page. Plain HTML and CSS, built by a tiny script with no dependencies.

```
starnest-website/
├── site.config.json   ← company name, contact email, WhatsApp, prices, Play Store link, site address
├── build.mjs          builds everything into dist
└── src/               pages, shared header/footer, styles, images and logos
```

The live demo is `src/demo/index.html`, a copy of `docs/index.html` from the OrderNest repo. When the demo changes there, copy it over again.

## Change the details

Edit `site.config.json` and push. Empty settings are left out of the pages.

| Setting | What it changes |
|---|---|
| `email`, `whatsapp` | Contact buttons and the privacy / delete-account pages |
| `priceStarter`, `pricePro` | Prices on the OrderNest page, for example `"₹499 / month"`. Empty shows "Ask us" |
| `playUrl` | Shows a "Get it on Google Play" button once the app is live |
| `appUrl` | Your OrderNest server address, for "Sign in" and the in-app delete page |
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
   - Project name: `starnest-website` (must match `"name"` in `wrangler.jsonc`)
   - Build command: `node build.mjs`
   - Deploy command: `npx wrangler deploy`
4. Click **Deploy**. The site goes live at `https://starnest-website.<your-subdomain>.workers.dev`. Put that address in `siteUrl` in `site.config.json`.
5. Every push to `main` rebuilds the site automatically.

`wrangler.jsonc` tells Cloudflare to serve the built `dist` folder as a static site, with `_headers`, `_redirects` and the 404 page.

**Add your own domain later** (e.g. `starnest.in`): go to the Pages project → **Custom domains → Set up a domain**, and follow the steps. Then update `siteUrl` in `site.config.json`.

**Google Play links** once it's live:
- Privacy policy: `https://starnest-website.iamjoshuaselvam.workers.dev/privacy/`
- Account deletion: `https://starnest-website.iamjoshuaselvam.workers.dev/delete-account/`
