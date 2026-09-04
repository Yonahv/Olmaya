# Olmaya Winery website

A static site (no build step) for Olmaya Winery — ready for GitHub + Cloudflare Pages.

## What's here

```
index.html              the whole site (one page, sections linked by nav)
css/style.css            all styling
js/main.js                nav, gallery lightbox, order/contact form logic
images/                     bottle, label, vineyard photos (already compressed for web)
functions/api/send.js  Cloudflare Pages Function that emails form submissions via Resend
```

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

## 2. Connect it to Cloudflare Pages

In the Cloudflare dashboard: **Workers & Pages -> Create -> Pages -> Connect to Git**, pick this repo.
Build settings:
- **Build command:** leave blank
- **Build output directory:** `/`

Deploy. Cloudflare will auto-redeploy every time you push to `main`.

Then, in your existing Cloudflare domain, add this Pages project as a custom domain (**Custom domains** tab in the Pages project) so it serves from olmayawines.com (or whichever domain you point at it).

## 3. Turn on the order/contact forms (Resend)

The forms POST to `/api/send`, which is the file at `functions/api/send.js`. It uses your Resend account to email submissions to `yonah@olmayawines.com`.

1. In Resend, grab an **API key** (Dashboard -> API Keys).
2. In the Cloudflare Pages project -> **Settings -> Environment variables**, add for the **Production** environment:
   - `RESEND_API_KEY` = your key (mark it as a secret)
3. Optional, once you verify `olmayawines.com` as a sending domain in Resend (Resend -> Domains -> Add Domain, then add the DNS records it gives you — easy since your domain is already on Cloudflare):
   - `FROM_EMAIL` = `Olmaya Winery <orders@olmayawines.com>`
   - Until you do this, emails send from Resend's shared test address (`onboarding@resend.dev`), which works fine but looks less polished in your inbox.
4. Redeploy (or just push again) after adding the variables.

If `RESEND_API_KEY` isn't set yet, the forms will show a friendly error with a mailto fallback instead of silently failing.

**Note:** the forms only work once the site is actually deployed to Cloudflare Pages (Functions don't run if you just double-click `index.html` locally). To test locally with functions working, you can use `npx wrangler pages dev .` from inside the folder.

## 4. Add your real Grow payment link

Open `js/main.js` and find this near the top:

```js
const GROW_LINK = "https://grow.link/REPLACE_WITH_YOUR_GROW_LINK";
```

Replace it with your actual Grow checkout link. Right now, submitting the order form emails you the order details, then sends the buyer on to that link to pay — once you drop in the real URL, that flow is live.

## 5. Everyday edits

- **Prices / wine descriptions:** in `index.html`, search for `wines-grid`.
- **Delivery area / contact info:** search for `order-note` and the `<footer>` section in `index.html`.
- **Photos:** drop a new file into `images/`, then point the relevant `<img src="...">` at it. Keep new photos under ~1500px wide and compress them (e.g. with Squoosh.app) so the site stays fast.
- **Colors / fonts:** the gold, cream, and dark tones are set as CSS variables at the top of `css/style.css` (`:root { ... }`) — change them once and they apply everywhere.

## Known placeholders to revisit

- [ ] Real Grow payment link (`js/main.js`)
- [ ] Resend domain verification for a clean "from" address (`FROM_EMAIL`)
- [ ] Hebrew version of the site (footer currently just says "coming soon")
