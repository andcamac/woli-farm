/* ═══════════════════════════════════════════
   MAIN — Boot Sequence
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load state
  const state = loadState();

  // 2. Init farm logic
  Farm.init(state);

  // 3. Build scene
  initStars();
  initClouds();
  initGrass();

  // 4. Start real-time clock
  Clock.start(state,
    // onTick (every second)
    (s) => UI.render(s),
    // onDay (day transition)
    (s, day) => Farm.onDayChange(s, day)
  );

  // 5. Note: water button onclick is Farm.water() via HTML attribute.
  //    Farm.water() checks if cycle is not active and calls plant() internally.
  //    UI.updateButtons() handles the visual plant/water toggle each render.

  // 6. Initial render
  UI.render(state);
  UI.log(state, '🌿 Woli Farm iniciado — ciclo de 7 días reales', '');

  if (state.cycleActive) {
    UI.log(state, `📅 Ciclo activo — Día ${state.cycleDay}/7`, 'day');
  } else {
    UI.log(state, `💰 Balance: ${state.coins} WOLI · Semillas: ${state.seeds}`, 'good');
  }

  // 7. Request notification permission on first interaction
  document.body.addEventListener('click', () => {
    Notifications.requestPermission();
  }, { once: true });
});
