/* ═══════════════════════════════════════════
   MAIN — Boot Sequence
   Woli Farm · Web3 Demo
   v2: Async cloud-first boot
═══════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Esperar a que Firebase Auth resuelva el usuario antes de bootear
  // (necesario porque loadState() es async y necesita auth.currentUser)
  if (typeof firebase !== 'undefined') {
    let booted = false;
    firebase.auth().onAuthStateChanged((user) => {
      if (booted) return;
      booted = true;
      bootGame();
    });
    // Fallback: si auth no responde en 3s, bootear igual con localStorage
    setTimeout(() => {
      if (!booted) {
        booted = true;
        bootGame();
      }
    }, 3000);
  } else {
    bootGame();
  }
});

async function bootGame() {
  // 1. Load state (cloud-first, fallback localStorage)
  const state = await loadState();

  // 2. Init farm logic
  Farm.init(state);

  // 3. Build scene
  initStars();
  initClouds();
  initGrass();

  // 4. Start real-time clock
  Clock.start(state,
    (s) => UI.render(s),
    (s, day) => Farm.onDayChange(s, day)
  );

  // 5. Initial render
  UI.render(state);
  UI.log(state, '🌿 Woli Farm iniciado — ciclo de 7 días reales', '');

  if (state.cycleActive) {
    UI.log(state, `📅 Ciclo activo — Día ${state.cycleDay}/7`, 'day');
  } else {
    UI.log(state, `💰 Balance: ${state.coins} WOLI · Semillas: ${state.seeds}`, 'good');
  }

  // 6. Request notification permission on first interaction
  document.body.addEventListener('click', () => {
    Notifications.requestPermission();
  }, { once: true });
}
