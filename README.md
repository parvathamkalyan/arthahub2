# ArthaHub — affiliate marketing starter

A working site: product feed with real affiliate links, click tracking
dashboard, a blog page for SEO content, and a "Guide" chat widget in the
bottom-right corner that answers setup questions.

## Run it locally first
```
npm install
cp .env.example .env
npm start
```
Open http://localhost:3000 — the site works immediately with sample
products, even before you fill in `.env`.

## What's inside
- `public/index.html` — landing page + product grid
- `public/dashboard.html` — click tracking (not real bank data — see note in that file)
- `public/blog.html` — placeholder SEO articles, replace with real content
- `public/guide.js` — the floating chat widget, calls `/api/chat`
- `server/server.js` — all backend routes
- `server/data.json` — auto-created on first run, stores products + clicks (swap for a real database later)

## Step-by-step deploy (all free)

1. **GitHub**: create a repo, push this folder to it.
2. **Vercel or Railway** (Railway is simpler for a Node server with a
   persistent file/DB): sign in with GitHub, "New Project" → pick this
   repo → it auto-detects Node and deploys. You get a live `.up.railway.app`
   or `.vercel.app` URL.
3. In the hosting dashboard, go to **Environment Variables** and paste in
   everything from your `.env` (never commit `.env` itself — it's already
   in `.gitignore`).
4. Redeploy. Your site is now live with your real affiliate tag.

## Filling in real data

- Replace the `seedProducts()` array in `server/server.js` with products
  you actually want to promote. Long-term, this is where you'd plug in
  Amazon's Product Advertising API / Flipkart's product feed instead of
  hand-typing products.
- `buildAffiliateLink()` already knows how to attach your Amazon tag,
  Flipkart ID, or Meesho ID — just fill those into `.env`.
- For the Guide chat to use real AI instead of canned answers, get a free
  key at https://aistudio.google.com/app/apikey and set `GEMINI_API_KEY`.

## What this does NOT do (by design)

- It does not connect to your bank account or move money — no legitimate
  affiliate or hosting setup does that from a website you control.
  Commission payouts come directly from Amazon/Flipkart/Meesho to your
  bank on their own schedule.
- It does not auto-post to Instagram/Facebook yet — that needs a Meta
  Developer app + long-lived access token (see the account setup steps
  from earlier in our chat). Once you have `META_ACCESS_TOKEN`, that's
  the next module to add.
