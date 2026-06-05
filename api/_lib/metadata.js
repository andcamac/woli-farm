/* ═══════════════════════════════════════════
   METADATA — fully on-chain token URI builder
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   Produces a data:application/json;base64 URI whose
   "image" is an embedded SVG data URI. No IPFS or
   external hosting needed — the NFT is self-contained.
═══════════════════════════════════════════ */
'use strict';

function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

// "💎 Legendaria" → "Legendaria"
function rarityName(label) {
  const parts = String(label || 'Básica').trim().split(/\s+/);
  return parts[parts.length - 1] || 'Básica';
}

function buildSvg(h) {
  const color   = /^#[0-9a-fA-F]{3,8}$/.test(h.rarityColor || '') ? h.rarityColor : '#4caf78';
  const tokenId = String(h.tokenId || 0).padStart(4, '0');
  const rarity  = xmlEscape(rarityName(h.rarityLabel));
  const health  = Number(h.health || 0);
  const perfect = Number(h.perfectDays || 0);
  const streak  = Number(h.maxStreak || 0);
  const woli    = Number(h.coinsEarned || 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1f10"/>
      <stop offset="1" stop-color="#10301a"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect x="12" y="12" width="376" height="376" rx="18" fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>
  <text x="200" y="72" text-anchor="middle" fill="#c8a84b" font-family="monospace" font-size="14" letter-spacing="6">WOLI HARVEST</text>
  <circle cx="200" cy="190" r="80" fill="none" stroke="${color}" stroke-width="3" opacity="0.5"/>
  <text x="200" y="208" text-anchor="middle" fill="#f5f0e8" font-family="Georgia,'Times New Roman',serif" font-size="54" font-weight="bold">#${tokenId}</text>
  <text x="200" y="300" text-anchor="middle" fill="${color}" font-family="Georgia,serif" font-size="26">${rarity}</text>
  <text x="200" y="338" text-anchor="middle" fill="#8fd4a8" font-family="monospace" font-size="13">HP ${health}  ·  PERFECT ${perfect}/7  ·  STREAK ${streak}</text>
  <text x="200" y="360" text-anchor="middle" fill="#f0d080" font-family="monospace" font-size="13">${woli} WOLI EARNED</text>
</svg>`;
}

// Returns the metadata object (name/description/image/attributes).
function buildMetadata(h) {
  const svg   = buildSvg(h);
  const image = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');

  return {
    name:        `Woli Harvest #${String(h.tokenId || 0).padStart(4, '0')}`,
    description: 'A Woli Farm harvest — proof of a completed 7-day real-time hemp grow cycle. Rarity reflects the grower\u2019s performance. Woli CBD · Costa Rica.',
    image,
    attributes: [
      { trait_type: 'Rarity',       value: rarityName(h.rarityLabel) },
      { trait_type: 'Rarity Score', value: Number(h.rarityPct || 0) },
      { trait_type: 'Health',       value: Number(h.health || 0) },
      { trait_type: 'Perfect Days', value: Number(h.perfectDays || 0) },
      { trait_type: 'Max Streak',   value: Number(h.maxStreak || 0) },
      { trait_type: 'WOLI Earned',  value: Number(h.coinsEarned || 0) },
    ],
  };
}

// Self-contained data: URI (used by the EVM on-chain tokenURI path).
function buildTokenUri(h) {
  return 'data:application/json;base64,' +
    Buffer.from(JSON.stringify(buildMetadata(h)), 'utf8').toString('base64');
}

// Querystring of harvest fields, for the public metadata endpoint
// (Solana `uri` points here so indexers fetch JSON over HTTPS).
function buildMetadataQuery(h) {
  const p = new URLSearchParams();
  p.set('tokenId',     String(h.tokenId || 0));
  p.set('rarityLabel', String(h.rarityLabel || ''));
  p.set('rarityColor', String(h.rarityColor || ''));
  p.set('rarityPct',   String(Number(h.rarityPct || 0)));
  p.set('health',      String(Number(h.health || 0)));
  p.set('perfectDays', String(Number(h.perfectDays || 0)));
  p.set('maxStreak',   String(Number(h.maxStreak || 0)));
  p.set('coinsEarned', String(Number(h.coinsEarned || 0)));
  return p.toString();
}

// Rebuild a harvest-like object from query params (inverse of buildMetadataQuery).
function harvestFromQuery(q) {
  q = q || {};
  return {
    tokenId:     Number(q.tokenId) || 0,
    rarityLabel: q.rarityLabel || 'Básica',
    rarityColor: q.rarityColor || '#4caf78',
    rarityPct:   Number(q.rarityPct) || 0,
    health:      Number(q.health) || 0,
    perfectDays: Number(q.perfectDays) || 0,
    maxStreak:   Number(q.maxStreak) || 0,
    coinsEarned: Number(q.coinsEarned) || 0,
  };
}

module.exports = {
  buildTokenUri, buildMetadata, buildSvg, rarityName,
  buildMetadataQuery, harvestFromQuery,
};
