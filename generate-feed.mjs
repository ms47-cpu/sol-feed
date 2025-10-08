// Lädt Solana-Paare von DexScreener, filtert USD-Quotes, nimmt Top-N und schreibt feed/sol-feed.json
import fs from 'fs';
const DEXSCREENER_PAIRS_URL = 'https://api.dexscreener.com/latest/dex/pairs/solana';

// Schwellen (kannst du anpassen)
const MIN_LIQ_USD = 300000;
const MIN_VOL24_USD = 1000000;
const MAX_ITEMS = 30;

const res = await fetch(DEXSCREENER_PAIRS_URL, { headers: { 'user-agent': 'orion-feed/1.0' } });
if (!res.ok) throw new Error(`HTTP_${res.status}`);
const data = await res.json();
const pairs = data?.pairs || [];

const out = [];
for (const p of pairs) {
  const baseMint = p?.baseToken?.address;
  const quoteSym = (p?.quoteToken?.symbol || '').toUpperCase();
  const liq = Number(p?.liquidity?.usd || 0);
  const vol = Number(p?.volume?.h24 || 0);
  const isUsd = quoteSym.includes('USDC') || quoteSym.includes('USDT') || quoteSym.includes('USD');
  if (!baseMint || !isUsd) continue;
  if (liq < MIN_LIQ_USD || vol < MIN_VOL24_USD) continue;
  out.push({ mint: String(baseMint), liqUsd: liq, vol24Usd: vol });
  if (out.length >= MAX_ITEMS) break;
}

if (!fs.existsSync('feed')) fs.mkdirSync('feed', { recursive: true });
fs.writeFileSync('feed/sol-feed.json', JSON.stringify(out, null, 2));
console.log(`Wrote feed/sol-feed.json (${out.length} items)`);
