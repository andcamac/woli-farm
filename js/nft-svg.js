/* ═══════════════════════════════════════════
   NFT SVG — botanical cannabis plant renderer
   Woli Farm  ·  "Opción B" art
   ═══════════════════════════════════════════
   WoliNFT.buildSvg(harvest) returns an SVG of a
   layered cannabis plant whose look is driven by
   the harvest's traits, and is DETERMINISTIC per
   token (seeded), so the same NFT always renders
   identically.

   Trait → art mapping:
     rarity      → purple tint · trichome frost · cola size · leaf pairs
     health      → leaf colour (lush green → yellow → brown)
     perfectDays / maxStreak → golden sparkle accents
═══════════════════════════════════════════ */
'use strict';

const WoliNFT = (() => {

  // tiny seeded PRNG (mulberry32) so art is stable per token
  function seeded(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rarityName(label) {
    const p = String(label || 'Básica').trim().split(/\s+/);
    return p[p.length - 1] || 'Básica';
  }

  function rarityIndex(h) {
    const s = String(h.rarityLabel || '').toLowerCase();
    if (s.includes('legend')) return 4;
    if (s.includes('épic') || s.includes('epic')) return 3;
    if (s.includes('rar')) return 2;
    if (s.includes('com')) return 1;
    if (s.includes('bás') || s.includes('bas')) return 0;
    const p = Number(h.rarityPct || 0);
    return p >= 90 ? 4 : p >= 75 ? 3 : p >= 55 ? 2 : p >= 30 ? 1 : 0;
  }

  function greens(hp) {
    if (hp > 0.75) return { l: '#6fce92', m: '#3fae72', d: '#236b46' };
    if (hp > 0.50) return { l: '#a6d84a', m: '#7fb22e', d: '#4e6e16' };
    if (hp > 0.25) return { l: '#d8c24e', m: '#b2952e', d: '#6e5a16' };
    return { l: '#d88a4e', m: '#b2622e', d: '#6e3a16' };
  }

  const PUR = { l: '#c79bf2', m: '#9a5fd6', d: '#6a3aa0' };
  const SERR = 'M0 0 L5 -7 L3 -13 L8 -19 L5 -27 L10 -35 L6 -46 L8 -57 L4 -69 L5 -79 L2 -86 L0 -90 L-2 -86 L-5 -79 L-4 -69 L-8 -57 L-6 -46 L-10 -35 L-5 -27 L-8 -19 L-3 -13 L-5 -7 Z';

  function fanLeaf(k, g) {
    const angs = [-72, -48, -24, 0, 24, 48, 72];
    const sc   = [0.5, 0.72, 0.9, 1, 0.9, 0.72, 0.5];
    let s = '';
    for (let i = 0; i < angs.length; i++) {
      s += '<g transform="rotate(' + angs[i] + ') scale(' + sc[i] + ')">' +
           '<path d="' + SERR + '" fill="url(#lg' + k + ')" stroke="' + g.d + '" stroke-width="' + (1.2 / sc[i]).toFixed(2) + '"/>' +
           '<path d="M0 0 L0 -84" stroke="' + g.d + '" stroke-width="' + (0.8 / sc[i]).toFixed(2) + '" fill="none" opacity="0.4"/></g>';
    }
    return '<g>' + s + '</g>';
  }

  function cola(k, rnd, purpleFrac, trich, pist) {
    const calyx = [[0,0,16,19],[-12,7,12,15],[12,7,12,15],[-9,-13,12,15],[10,-13,11,14],
                   [0,-27,11,14],[-15,-3,10,13],[15,-3,10,13],[0,17,13,16],[-8,26,9,12],[8,26,9,12]];
    let s = '';
    for (let i = 0; i < calyx.length; i++) {
      const c = calyx[i];
      const f = (rnd() < purpleFrac) ? ('url(#pg' + k + ')') : ('url(#cg' + k + ')');
      s += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="' + c[3] + '" fill="' + f + '"/>';
      s += '<ellipse cx="' + (c[0]-c[2]*0.3).toFixed(1) + '" cy="' + (c[1]-c[3]*0.3).toFixed(1) + '" rx="' + (c[2]*0.38).toFixed(1) + '" ry="' + (c[3]*0.38).toFixed(1) + '" fill="#ffffff" opacity="0.25"/>';
    }
    for (let i = 0; i < pist; i++) {
      const a = rnd() * 6.283, r = 6 + rnd() * 16;
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.9 - 2;
      const dx = Math.cos(a) * 11, dy = Math.sin(a) * 11 - 6;
      s += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' q ' + (dx*0.4).toFixed(1) + ' ' + (dy*0.4).toFixed(1) + ' ' + dx.toFixed(1) + ' ' + dy.toFixed(1) + '" stroke="' + (i%2?'#e8843c':'#c4561e') + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    }
    for (let i = 0; i < trich; i++) {
      const x = (rnd()*2-1)*22, y = (rnd()*2-1)*30;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (0.8+rnd()*1.4).toFixed(1) + '" fill="#fff" opacity="0.8"/>';
    }
    return s;
  }

  function sparkles(rnd, n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = 200 + (rnd()*2-1)*70, y = 140 + (rnd()*2-1)*55, sc = 0.7 + rnd()*0.9;
      s += '<path transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + sc.toFixed(2) + ')" d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z" fill="#f0d080"/>';
    }
    return s;
  }

  function defs(k, g) {
    return '<defs>' +
      '<radialGradient id="bg' + k + '" cx="50%" cy="40%" r="78%"><stop offset="0" stop-color="#0c2415"/><stop offset="1" stop-color="#06160c"/></radialGradient>' +
      '<linearGradient id="lg' + k + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + g.d + '"/><stop offset="0.6" stop-color="' + g.m + '"/><stop offset="1" stop-color="' + g.l + '"/></linearGradient>' +
      '<radialGradient id="cg' + k + '" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="' + g.l + '"/><stop offset="1" stop-color="' + g.d + '"/></radialGradient>' +
      '<radialGradient id="pg' + k + '" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="' + PUR.l + '"/><stop offset="1" stop-color="' + PUR.d + '"/></radialGradient>' +
      '<radialGradient id="aura' + k + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + PUR.m + '" stop-opacity="0.45"/><stop offset="1" stop-color="' + PUR.m + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="fx' + k + '" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/></filter>' +
      '</defs>';
  }

  function buildSvg(h) {
    const id      = (Number(h.onChainTokenId || h.tokenId || 1)) >>> 0;
    const k       = 'w' + id;
    const rnd     = seeded((id * 2654435761) ^ Number(h.rarityPct || 0));
    const ri      = rarityIndex(h);
    const hp      = Math.max(0, Math.min(1, Number(h.health || 100) / 100));
    const g       = greens(hp);
    const purpleFrac = ri <= 1 ? 0 : (ri - 1) / 3;
    const trich   = 4 + ri * 7;
    const pist    = 4 + ri * 3;
    const colaSc  = 0.85 + ri * 0.07;
    const pairs   = ri < 2 ? 2 : ri < 4 ? 3 : 4;
    const gold    = (Number(h.perfectDays || 0) >= 5 || Number(h.maxStreak || 0) >= 4);
    const goldN   = Number(h.perfectDays || 0) >= 6 ? 5 : 3;
    const frame   = /^#[0-9a-fA-F]{3,8}$/.test(h.rarityColor || '') ? h.rarityColor : '#4caf78';

    const leaf = fanLeaf(k, g);
    const place = function (x, y, rot, s) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')">' + leaf + '</g>'; };
    const cfg = [[280,104,1.15],[232,80,1.0],[192,52,0.8],[168,32,0.62]];
    let leaves = '';
    for (let i = 0; i < pairs; i++) {
      const c = cfg[i];
      leaves += place(200, c[0], -c[1], c[2]) + place(200, c[0], c[1], c[2]);
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img">' +
      '<title>Woli Harvest #' + String(h.tokenId||0).padStart(4,'0') + '</title><desc>Planta de cannabis, rareza ' + rarityName(h.rarityLabel) + '</desc>' +
      defs(k, g) +
      '<rect x="0" y="0" width="400" height="400" fill="url(#bg' + k + ')"/>' +
      '<rect x="10" y="10" width="380" height="380" rx="20" fill="none" stroke="' + frame + '" stroke-width="2" opacity="0.55"/>' +
      (ri >= 2 ? '<ellipse cx="200" cy="150" rx="95" ry="105" fill="url(#aura' + k + ')"/>' : '') +
      '<g filter="url(#fx' + k + ')">' +
        '<line x1="200" y1="328" x2="200" y2="168" stroke="' + g.d + '" stroke-width="6" stroke-linecap="round"/>' +
        leaves +
        '<g transform="translate(200 140) scale(' + colaSc.toFixed(2) + ')">' + cola(k, rnd, purpleFrac, trich, pist) + '</g>' +
      '</g>' +
      (gold ? sparkles(rnd, goldN) : '') +
      '<polygon points="160,322 240,322 231,374 169,374" fill="#7a4a22"/>' +
      '<ellipse cx="200" cy="322" rx="42" ry="9" fill="#9a5a2a"/>' +
      '<ellipse cx="200" cy="321" rx="34" ry="6" fill="#3a2410"/>' +
      '</svg>';
  }

  return { buildSvg, rarityName, rarityIndex };
})();
