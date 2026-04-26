/* ═══════════════════════════════════════════
   SKY — Real-Time Day/Night Cycle
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */
'use strict';

function initStars() {
  const sky = document.getElementById('sky');
  for (let i = 0; i < 55; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2 + .4;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*65}%;--op:${(.2+Math.random()*.7).toFixed(2)};--d:${(2+Math.random()*4).toFixed(1)}s;--delay:${(Math.random()*3).toFixed(1)}s`;
    sky.appendChild(s);
  }
}

function initClouds() {
  const sky = document.getElementById('sky');
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('div');
    c.className = 'cloud';
    c.style.cssText = `width:${80+Math.random()*120}px;height:${10+Math.random()*40}px;top:${5+Math.random()*40}%;--spd:${(25+Math.random()*30).toFixed(0)}s;animation-delay:-${(Math.random()*30).toFixed(0)}s`;
    sky.appendChild(c);
  }
}

function updateSky(cycleActive, realHour) {
  const sky    = document.getElementById('sky');
  const sun    = document.getElementById('sun');
  const moon   = document.getElementById('moon');
  const clouds = document.querySelectorAll('.cloud');

  if (!cycleActive) {
    sky.style.background = '#050c12';
    sun.style.bottom = '-80px'; sun.style.opacity = '0';
    moon.style.opacity = '1';
    clouds.forEach(c => c.style.opacity = '0');
    return;
  }

  const hourFrac = realHour / 24;  // 0–1
  const isDaytime = realHour >= 6 && realHour < 20;

  if (isDaytime) {
    const dayFrac  = (realHour - 6) / 14;  // 0–1 during daytime
    const sunBot   = 20 + Math.sin(dayFrac * Math.PI) * 85;
    // Dawn/dusk tinting
    const isDawn = realHour < 9, isDusk = realHour >= 17;
    if (isDawn) {
      const t = (realHour - 6) / 3;
      sky.style.background = `hsl(${20 + t*200},${60 - t*30}%,${20 + t*15}%)`;
    } else if (isDusk) {
      const t = (realHour - 17) / 3;
      sky.style.background = `hsl(${220 - t*200},${30 + t*30}%,${35 - t*20}%)`;
    } else {
      sky.style.background = '#1a3a5c';
    }
    sun.style.bottom  = `${sunBot}px`;
    sun.style.opacity = '1';
    moon.style.opacity = '0';
    clouds.forEach(c => c.style.opacity = '.7');
  } else {
    const nightFrac = realHour < 6 ? (6 - realHour) / 6 : (realHour - 20) / 4;
    sky.style.background = '#050c12';
    sun.style.bottom = '-80px'; sun.style.opacity = '0';
    moon.style.opacity = `${(.4 + nightFrac * .6).toFixed(2)}`;
    clouds.forEach(c => c.style.opacity = '.08');
  }
}
