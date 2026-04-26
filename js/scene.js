/* ═══════════════════════════════════════════
   SCENE — Grass, Drops, Particles
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */
'use strict';

function initGrass() {
  const g = document.getElementById('ground');
  for (let i = 0; i < 38; i++) {
    const el = document.createElement('div');
    el.className = 'grass';
    const lean = (Math.random() - .5) * 6;
    el.style.cssText = `left:${Math.random()*100}%;height:${8+Math.random()*18}px;background:hsl(${100+Math.random()*40},60%,${25+Math.random()*20}%);--sw:${(2+Math.random()*2).toFixed(1)}s;--sd:${(Math.random()*2).toFixed(1)}s;--lean:${lean.toFixed(1)}deg`;
    g.appendChild(el);
  }
}

function spawnDrops() {
  const scene = document.getElementById('scene');
  const pot   = document.getElementById('pot-wrap');
  const sr    = scene.getBoundingClientRect();
  const pr    = pot.getBoundingClientRect();
  const cx    = pr.left - sr.left + pr.width / 2;
  const sy    = pr.top  - sr.top  - 40;
  for (let i = 0; i < 9; i++) {
    setTimeout(() => {
      const d = document.createElement('div');
      d.className = 'drop';
      d.style.cssText = `left:${cx + (Math.random()-.5)*65}px;top:${sy}px;--dist:${40+Math.random()*45}px;animation-delay:${(Math.random()*.35).toFixed(2)}s`;
      scene.appendChild(d);
      setTimeout(() => d.remove(), 1300);
    }, i * 75);
  }
}

function spawnFertParticles() {
  const scene = document.getElementById('scene');
  const pot   = document.getElementById('pot-wrap');
  const sr    = scene.getBoundingClientRect();
  const pr    = pot.getBoundingClientRect();
  const cx    = pr.left - sr.left + pr.width / 2;
  const cy    = pr.top  - sr.top;
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'fert-particle';
      const angle = Math.random() * Math.PI * 2;
      const dist  = 20 + Math.random() * 50;
      p.style.cssText = `left:${cx}px;top:${cy}px;--tx:${(Math.cos(angle)*dist).toFixed(0)}px;--ty:${(Math.sin(angle)*dist).toFixed(0)}px;animation-delay:${(Math.random()*.3).toFixed(2)}s`;
      scene.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }, i * 60);
  }
}

function spawnHarvestBurst() {
  const colors = ['#4caf78','#c8a84b','#8fd4a8','#f0d080','#2d7a4f','#ffd700'];
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = Math.random() * Math.PI * 2;
      const dist  = 80 + Math.random() * 180;
      p.style.cssText = `left:50%;top:50%;background:${colors[i%colors.length]};--tx:${(Math.cos(angle)*dist).toFixed(0)}px;--ty:${(Math.sin(angle)*dist).toFixed(0)}px;animation-delay:${(Math.random()*.5).toFixed(2)}s;animation-duration:${(.8+Math.random()*.7).toFixed(2)}s`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }, i * 35);
  }
}
