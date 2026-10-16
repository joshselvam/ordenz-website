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

## Publish free on Cloudflare Pages

1. Create a free account at <https://dash.cloudflare.com>.
2. Go to **Workers & Pages → Create → Pages → Connect to Git**, and allow access to the `starnest-website` repository (private repos are fine).
3. Use these build settings:
   - Framework preset: **None**
   - Build command: `node build.mjs`
   - Build output directory: `dist`
   - Root directory: *(leave empty)*
4. Click **Save and Deploy**. The site goes live at `https://<project-name>.pages.dev`. Name the project `starnest` to get `starnest.pages.dev`, if it's free.
5. Every push to `main` rebuilds the site automatically.

**Add your own domain later** (e.g. `starnest.in`): go to the Pages project → **Custom domains → Set up a domain**, and follow the steps. Then update `siteUrl` in `site.config.json`.

**Google Play links** once it's live:
- Privacy policy: `https://starnest.pages.dev/privacy/`
- Account deletion: `https://starnest.pages.dev/delete-account/`
