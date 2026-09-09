// ArthaHub backend
// Handles: product feed, affiliate link building, click/earnings tracking,
// and the in-app "Guide" chat (uses free Google Gemini API when a key is set).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = { products: seedProducts(), clicks: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function seedProducts() {
  // Replace with real products pulled from Amazon/Flipkart/Meesho once
  // your affiliate accounts are approved. This seed data lets you see
  // the full site working before those accounts exist.
  return [
    {
      id: 'p1',
      title: 'Wireless Earbuds',
      price: 1499,
      category: 'Electronics',
      platform: 'amazon',
      rawUrl: 'https://www.amazon.in/dp/EXAMPLE1',
      image: 'https://placehold.co/400x400?text=Earbuds'
    },
    {
      id: 'p2',
      title: 'Study Desk Lamp',
      price: 699,
      category: 'Home',
      platform: 'flipkart',
      rawUrl: 'https://www.flipkart.com/EXAMPLE2',
      image: 'https://placehold.co/400x400?text=Desk+Lamp'
    },
    {
      id: 'p3',
      title: 'Cotton Backpack',
      price: 899,
      category: 'Fashion',
      platform: 'meesho',
      rawUrl: 'https://www.meesho.com/EXAMPLE3',
      image: 'https://placehold.co/400x400?text=Backpack'
    }
  ];
}

// Build the real affiliate link for a product depending on platform
function buildAffiliateLink(product) {
  const url = new URL(product.rawUrl);
  if (product.platform === 'amazon' && process.env.AMAZON_ASSOCIATE_TAG) {
    url.searchParams.set('tag', process.env.AMAZON_ASSOCIATE_TAG);
  } else if (product.platform === 'flipkart' && process.env.FLIPKART_AFFILIATE_ID) {
    url.searchParams.set('affid', process.env.FLIPKART_AFFILIATE_ID);
  } else if (product.platform === 'meesho' && process.env.MEESHO_AFFILIATE_ID) {
    url.searchParams.set('utm_source', process.env.MEESHO_AFFILIATE_ID);
  }
  return url.toString();
}

// GET all products with their ready-to-use affiliate links
app.get('/api/products', (req, res) => {
  const data = loadData();
  const withLinks = data.products.map(p => ({
    ...p,
    affiliateLink: buildAffiliateLink(p)
  }));
  res.json(withLinks);
});

// Record a click (call this right before redirecting a visitor out to the product)
app.post('/api/click', (req, res) => {
  const { productId } = req.body;
  const data = loadData();
  const product = data.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'product not found' });

  data.clicks.push({ productId, timestamp: new Date().toISOString() });
  saveData(data);
  res.json({ ok: true, redirect: buildAffiliateLink(product) });
});

// Earnings dashboard data — click counts per product.
// NOTE: actual commission amounts come from each affiliate network's own
// reporting dashboard/API (Amazon/Flipkart/Meesho don't tell you sales in
// real time via a public API) — this shows clicks you generated, which is
// the leading indicator you control.
app.get('/api/dashboard', (req, res) => {
  const data = loadData();
  const counts = {};
  data.clicks.forEach(c => {
    counts[c.productId] = (counts[c.productId] || 0) + 1;
  });
  const summary = data.products.map(p => ({
    id: p.id,
    title: p.title,
    clicks: counts[p.id] || 0
  }));
  res.json({ totalClicks: data.clicks.length, products: summary });
});

// In-app "Guide" chat — answers setup/how-it-works questions.
// Uses free Google Gemini API if GEMINI_API_KEY is set; otherwise falls
// back to canned answers so the widget still works with zero cost.
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ reply: fallbackAnswer(message) });
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are the in-app guide for ArthaHub, an affiliate marketing site. Answer briefly and practically. User question: ${message}`
            }]
          }]
        })
      }
    );
    const json = await r.json();
    const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text || fallbackAnswer(message);
    res.json({ reply });
  } catch (err) {
    res.json({ reply: fallbackAnswer(message) });
  }
});

function fallbackAnswer(message) {
  const m = message.toLowerCase();
  if (m.includes('amazon')) return 'Amazon Associates: affiliate-program.amazon.in లో signup చేసి, PAN card + bank details ఇచ్చి, Associate Tag ని .env లో AMAZON_ASSOCIATE_TAG గా పెట్టు.';
  if (m.includes('flipkart')) return 'Flipkart Affiliate: affiliate.flipkart.com లో signup చేసి, approval తర్వాత వచ్చే ID ని .env లో పెట్టు.';
  if (m.includes('dashboard') || m.includes('earning')) return 'Dashboard నీ clicks చూపిస్తుంది. Actual commission ప్రతి affiliate network dashboard లోనే కనిపిస్తుంది — ఆ నెంబర్లను ఇక్కడ కూడా చూడాలంటే ఆ network యొక్క reporting API connect చేయాలి.';
  return 'ఇది ఒక demo guide reply. నిజమైన AI guide కోసం .env లో GEMINI_API_KEY పెట్టు — aistudio.google.com/app/apikey నుండి ఉచితంగా వస్తుంది.';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ArthaHub running on http://localhost:${PORT}`));
