/* ═══════════════════════════════════════════
   NFT SVG — shared client-side card renderer
   Woli Farm
   ═══════════════════════════════════════════
   Builds the Woli Harvest NFT card SVG from a
   harvest's attributes. Mirrors api/_lib/metadata.js
   so the on-page preview matches the token art.
   Usage:  el.innerHTML = WoliNFT.buildSvg(harvest);
═══════════════════════════════════════════ */
'use strict';

const WoliNFT = (() => {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  }

  function rarityName(label) {
    const p = String(label || 'Básica').trim().split(/\s+/);
    return p[p.length - 1] || 'Básica';
  }

  function buildSvg(h) {
    const color   = /^#[0-9a-fA-F]{3,8}$/.test(h.rarityColor || '') ? h.rarityColor : '#4caf78';
    const tokenId = String(h.tokenId || 0).padStart(4, '0');
    const rarity  = esc(rarityName(h.rarityLabel));
    const health  = Number(h.health || 0);
    const perfect = Number(h.perfectDays || 0);
    const streak  = Number(h.maxStreak || 0);
    const woli    = Number(h.coinsEarned || 0);
    const gid     = 'bg-' + tokenId + '-' + Math.random().toString(36).slice(2, 7);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a1f10"/><stop offset="1" stop-color="#10301a"/>
      </linearGradient></defs>
      <rect width="400" height="400" fill="url(#${gid})"/>
      <rect x="12" y="12" width="376" height="376" rx="18" fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>
      <text x="200" y="72" text-anchor="middle" fill="#c8a84b" font-family="monospace" font-size="14" letter-spacing="6">WOLI HARVEST</text>
      <circle cx="200" cy="190" r="80" fill="none" stroke="${color}" stroke-width="3" opacity="0.5"/>
      <text x="200" y="208" text-anchor="middle" fill="#f5f0e8" font-family="Georgia,serif" font-size="54" font-weight="bold">#${tokenId}</text>
      <text x="200" y="300" text-anchor="middle" fill="${color}" font-family="Georgia,serif" font-size="26">${rarity}</text>
      <text x="200" y="338" text-anchor="middle" fill="#8fd4a8" font-family="monospace" font-size="13">HP ${health}  ·  PERFECT ${perfect}/7  ·  STREAK ${streak}</text>
      <text x="200" y="360" text-anchor="middle" fill="#f0d080" font-family="monospace" font-size="13">${woli} WOLI EARNED</text>
    </svg>`;
  }

  return { buildSvg, rarityName };
})();
