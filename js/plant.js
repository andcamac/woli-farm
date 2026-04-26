/* ═══════════════════════════════════════════
   PLANT — SVG Drawing for 8 Growth Stages
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */

'use strict';

function plantColors(h) {
  if (h > 0.75) return { g: '#4caf78', d: '#2d7a4f', s: '#3a8d5a' };
  if (h > 0.5)  return { g: '#8fc840', d: '#4a6a10', s: '#5a7a20' };
  if (h > 0.25) return { g: '#c8a840', d: '#8a6010', s: '#9a7020' };
  return               { g: '#c86040', d: '#6a2010', s: '#8a3020' };
}

function _lp(x,y,sz,f,d,a) {
  const r=a*Math.PI/180, dx=Math.sin(r)*sz*.8, dy=-Math.cos(r)*sz*.5;
  return `<path d="M${x},${y} C${x-dx*.5+dy*.3},${y+dy*.5-dx*.3} ${x-dx+dy},${y+dy-dx} ${x-dx*1.5},${y+dy*.5}" fill="${f}" opacity=".75"/>
          <path d="M${x},${y} C${x+dx*.5+dy*.3},${y+dy*.5+dx*.3} ${x+dx+dy},${y+dy+dx} ${x+dx*1.5},${y+dy*.5}" fill="${d}" opacity=".75"/>`;
}

function _cl(x,y,sz,f,d,rot) {
  const s=sz;
  return `<g transform="rotate(${rot},${x},${y})">
    <path d="M${x},${y} C${x-s*.1},${y-s*.3} ${x-s*.5},${y-s*.4} ${x-s*.6},${y-s*.2} C${x-s*.7},${y} ${x-s*.4},${y+s*.1} ${x},${y}Z" fill="${f}" opacity=".8"/>
    <path d="M${x},${y} C${x+s*.1},${y-s*.3} ${x+s*.5},${y-s*.4} ${x+s*.6},${y-s*.2} C${x+s*.7},${y} ${x+s*.4},${y+s*.1} ${x},${y}Z" fill="${d}" opacity=".8"/>
    <path d="M${x},${y} C${x-s*.05},${y-s*.5} ${x-s*.3},${y-s*.8} ${x-s*.4},${y-s*.7} C${x-s*.5},${y-s*.6} ${x-s*.2},${y-s*.3} ${x},${y}Z" fill="${f}" opacity=".7"/>
    <path d="M${x},${y} C${x+s*.05},${y-s*.5} ${x+s*.3},${y-s*.8} ${x+s*.4},${y-s*.7} C${x+s*.5},${y-s*.6} ${x+s*.2},${y-s*.3} ${x},${y}Z" fill="${d}" opacity=".7"/>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y-s*.85}" stroke="${d}" stroke-width="1" opacity=".4"/>
  </g>`;
}

function _bud(x,y,f,d,gold,full) {
  if (!full) return `
    <ellipse cx="${x}" cy="${y}" rx="10" ry="14" fill="${d}" opacity=".7"/>
    <ellipse cx="${x-5}" cy="${y+4}" rx="6" ry="9" fill="${f}" opacity=".6"/>
    <ellipse cx="${x+5}" cy="${y+4}" rx="6" ry="9" fill="${f}" opacity=".6"/>
    <ellipse cx="${x}" cy="${y-4}" rx="7" ry="10" fill="${f}" opacity=".7"/>
    <path d="M${x-3},${y-10} Q${x-6},${y-18} ${x-4},${y-20}" stroke="#f0a090" stroke-width="1" fill="none" opacity=".5"/>
    <path d="M${x+3},${y-10} Q${x+6},${y-18} ${x+4},${y-20}" stroke="#f0a090" stroke-width="1" fill="none" opacity=".5"/>`;

  return `
    <ellipse cx="${x}" cy="${y+5}" rx="18" ry="26" fill="${d}" opacity=".85"/>
    <ellipse cx="${x-10}" cy="${y+12}" rx="11" ry="16" fill="${f}" opacity=".7"/>
    <ellipse cx="${x+10}" cy="${y+12}" rx="11" ry="16" fill="${f}" opacity=".7"/>
    <ellipse cx="${x}" cy="${y-4}" rx="12" ry="18" fill="${f}" opacity=".8"/>
    <circle cx="${x-4}" cy="${y-6}" r="1.5" fill="${gold}" opacity=".7"/>
    <circle cx="${x+6}" cy="${y-2}" r="1.5" fill="${gold}" opacity=".65"/>
    <circle cx="${x-8}" cy="${y+4}" r="1.2" fill="${gold}" opacity=".6"/>
    <circle cx="${x+4}" cy="${y+10}" r="1.5" fill="${gold}" opacity=".65"/>
    <circle cx="${x}" cy="${y-12}" r="1.5" fill="${gold}" opacity=".7"/>
    <path d="M${x-5},${y-16} Q${x-10},${y-26} ${x-8},${y-30}" stroke="#e07850" stroke-width="1.2" fill="none" opacity=".7"/>
    <path d="M${x+5},${y-16} Q${x+10},${y-26} ${x+8},${y-30}" stroke="#e07850" stroke-width="1.2" fill="none" opacity=".7"/>
    <path d="M${x-2},${y-18} Q${x-4},${y-28} ${x-1},${y-32}" stroke="#d06040" stroke-width="1" fill="none" opacity=".6"/>
    <path d="M${x+2},${y-18} Q${x+4},${y-28} ${x+1},${y-32}" stroke="#d06040" stroke-width="1" fill="none" opacity=".6"/>
    <ellipse cx="${x}" cy="${y+5}" rx="22" ry="28" fill="${f}" opacity=".05"/>`;
}

function drawPlant(stageIdx, healthPct) {
  const svg = document.getElementById('plant-svg');
  const hp  = healthPct / 100;
  const {g,d,s} = plantColors(hp);
  const GOLD = '#c8a84b';
  let c = '';

  switch(stageIdx) {
    case 0: // no seed
      c = `<text x="100" y="260" text-anchor="middle" font-size="12" fill="${g}" opacity=".4" font-family="monospace">↓ planta semilla</text>`;
      break;
    case 1: // seed in soil - germinating
      c = `<ellipse cx="100" cy="263" rx="7" ry="5" fill="#8B6914" opacity=".8"/>
           <ellipse cx="100" cy="263" rx="5" ry="3.5" fill="#c8a84b" opacity=".6"/>
           <line x1="100" y1="260" x2="100" y2="248" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2" opacity=".5"/>`;
      break;
    case 2: // sprout
      c = `<ellipse cx="100" cy="263" rx="7" ry="5" fill="#8B6914" opacity=".7"/>
           <line x1="100" y1="260" x2="100" y2="238" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
           <path d="M100 246 C94 238 88 236 90 230 C92 224 100 226 100 238" fill="${g}" opacity=".8"/>
           <path d="M100 246 C106 238 112 236 110 230 C108 224 100 226 100 238" fill="${d}" opacity=".7"/>`;
      break;
    case 3: // seedling
      c = `<line x1="100" y1="263" x2="100" y2="230" stroke="${s}" stroke-width="4" stroke-linecap="round"/>
           ${_lp(100,238,20,g,d,-30)} ${_lp(100,238,20,g,d,30)}
           ${_cl(100,222,22,g,d,0)}`;
      break;
    case 4: // vegetative
      c = `<line x1="100" y1="265" x2="100" y2="195" stroke="${s}" stroke-width="4.5" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="82" y2="226" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="118" y2="226" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/>
           ${_cl(82,223,28,g,d,-15)} ${_cl(118,223,28,g,d,15)}
           ${_cl(100,195,32,g,d,0)}`;
      break;
    case 5: // bushy vegetative
      c = `<line x1="100" y1="265" x2="100" y2="178" stroke="${s}" stroke-width="5" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="76" y2="222" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="124" y2="222" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
           <line x1="100" y1="215" x2="70" y2="194" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/>
           <line x1="100" y1="215" x2="130" y2="194" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/>
           ${_cl(76,220,32,g,d,-20)} ${_cl(124,220,32,g,d,20)}
           ${_cl(68,192,30,d,d,-28)} ${_cl(132,192,30,d,d,28)}
           ${_cl(100,178,34,g,d,0)}`;
      break;
    case 6: // pre-flower / flower
      c = `<line x1="100" y1="265" x2="100" y2="158" stroke="${s}" stroke-width="5.5" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="72" y2="218" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="128" y2="218" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>
           <line x1="100" y1="212" x2="66" y2="186" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
           <line x1="100" y1="212" x2="134" y2="186" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
           <line x1="100" y1="182" x2="78" y2="165" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/>
           <line x1="100" y1="182" x2="122" y2="165" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/>
           ${_cl(70,216,36,d,d,-22)} ${_cl(130,216,36,d,d,22)}
           ${_cl(64,184,34,g,d,-30)} ${_cl(136,184,34,g,d,30)}
           ${_cl(76,163,30,g,d,-12)} ${_cl(124,163,30,g,d,12)}
           ${_bud(100,158,g,d,GOLD,false)}`;
      break;
    case 7: // full harvest bud
      c = `<line x1="100" y1="265" x2="100" y2="143" stroke="${s}" stroke-width="6" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="68" y2="216" stroke="${s}" stroke-width="4" stroke-linecap="round"/>
           <line x1="100" y1="248" x2="132" y2="216" stroke="${s}" stroke-width="4" stroke-linecap="round"/>
           <line x1="100" y1="208" x2="62" y2="180" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>
           <line x1="100" y1="208" x2="138" y2="180" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>
           <line x1="100" y1="172" x2="72" y2="156" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
           <line x1="100" y1="172" x2="128" y2="156" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
           ${_cl(66,214,40,d,d,-22)} ${_cl(134,214,40,d,d,22)}
           ${_cl(60,178,38,g,d,-32)} ${_cl(140,178,38,g,d,32)}
           ${_cl(70,154,34,g,d,-12)} ${_cl(130,154,34,g,d,12)}
           ${_bud(100,143,g,d,GOLD,true)}`;
      break;
  }
  svg.innerHTML = c;
}
