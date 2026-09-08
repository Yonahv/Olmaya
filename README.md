# Olmaya Winery website

A static site for Olmaya Winery, deployed as a Cloudflare Worker (static assets + a small
API route), connected to this GitHub repo — Cloudflare rebuilds and deploys automatically
on every push to `main`.

## What's here

```
index.html          the whole site (one page, sections linked by nav)
css/style.css        all styling
js/main.js            nav, gallery lightbox, contact form logic
images/                 bottle, label, vineyard photos (already compressed for web)
src/worker.js        the Cloudflare Worker: serves the static site, and handles
                      POSTs to /api/send by emailing them via Resend
wrangler.jsonc      Worker config (name, the ASSETS binding, which file is the entry point)
.assetsignore       files excluded from the public static-asset upload (.git, .wrangler)
```

Ordering: each wine card's "Order" button links straight to the Grow hosted checkout page (customer picks product/quantity and pays there) — the site itself doesn't collect order details.

## 1. Put it on GitHub

```
cd olmaya-site
git init
git add .
git commit -m "Olmaya winery site"
```
Then create a new empty repo on github.com (no README/license), and:
```
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 2. How it's deployed

This project is connected to Cloudflare as a **Worker** (Workers & Pages -> your `olmaya`
project), not classic Pages — Cloudflare's build log runs `npx wrangler deploy`, which
reads `wrangler.jsonc` and deploys `src/worker.js` plus everything in this repo as static
assets (except what's listed in `.assetsignore`). Every push to `main` triggers a redeploy
automatically; there's nothing to click.

The site's custom domain (olmayawines.com) is attached to this Worker under
**Settings -> Domains & Routes** in the Cloudflare dashboard.

## 3. Turn on the contact form (Resend)

The contact form POSTs to `/api/send`, handled inside `src/worker.js`. It uses your Resend
account to email submissions to `yonah@olmayawines.com`.

1. In Resend, grab an **API key** (Dashboard -> API Keys).
2. In the Cloudflare dashboard, open the `olmaya` Worker -> **Settings -> Variables and Secrets**, add:
   - `RESEND_API_KEY` = your key (as a **Secret**, not plain text)
3. Optional, once you verify `olmayawines.com` as a sending domain in Resend (Resend -> Domains -> Add Domain, then add the DNS records it gives you — easy since your domain is already on Cloudflare):
   - `FROM_EMAIL` = `Olmaya Winery <orders@olmayawines.com>`
   - Until you do this, emails send from Resend's shared test address (`onboarding@resend.dev`), which works fine but looks less polished in your inbox.
4. Redeploy (or just push again) after adding the variables.

If `RESEND_API_KEY` isn't set yet, the form will show a friendly error with a mailto fallback instead of silently failing.

**Note:** the form only works once the site is actually deployed (the Worker doesn't run if you just double-click `index.html` locally). To test locally with the API route working, run `npx wrangler dev` from inside the folder.

## 4. Changing the Grow payment link

Each wine card's "Order" button in `index.html` (search for `wine-meta`) links directly to the Grow hosted checkout page. If the link ever changes, update the `href` on both "Order" buttons.

## 5. Everyday edits

- **Prices / wine descriptions:** in `index.html`, search for `wines-grid`.
- **Delivery area / contact info:** search for `order-note` and the `<footer>` section in `index.html`.
- **Photos:** drop a new file into `images/`, then point the relevant `<img src="...">` at it. Keep new photos under ~1500px wide and compress them (e.g. with Squoosh.app) so the site stays fast.
- **Colors / fonts:** the gold, cream, and dark tones are set as CSS variables at the top of `css/style.css` (`:root { ... }`) — change them once and they apply everywhere.

## Known placeholders to revisit

- [ ] Hebrew version of the site (footer currently just says "coming soon")
