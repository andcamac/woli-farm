/* ═══════════════════════════════════════════
   STATE — Game State & Persistence
   Woli Farm · Web3 Demo
   v2: Cloud Save + Security integrado
═══════════════════════════════════════════ */

'use strict';

const STATE_KEY = 'woli_farm_v1';

function freshState() {
  return {
    v: 1,

    // Cycle tracking
    cycleActive:    false,
    cycleStartTime: null,
    cycleDay:       0,
    cycleComplete:  false,

    // Daily progress
    dayWaters:      0,
    dayFert:        0,
    dayPerfect:     false,
    todayOnTime:    { w: [false,false,false], f: [false] },

    // Across cycle
    perfectDays:    0,
    streakDays:     0,
    maxStreak:      0,

    // Plant
    health:         100,
    stageIdx:       0,

    // Inventory
    seeds:          CFG.START_SEEDS,
    water:          CFG.START_WATER,
    fert:           CFG.START_FERT,

    // Wallet
    coins:          CFG.START_COINS,
    coinsEarned:    0,
    coinsSpent:     0,

    // Tasks
    tasks:          [],
    lastDayChecked: null,

    // History
    dayHistory:            [],
    totalCyclesCompleted:  0,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1) return freshState();

    // Verificar integridad anti-cheat
    if (window.Security && !Security.verifyStateIntegrity(parsed)) {
      console.warn('⚠️ Estado local comprometido, usando freshState.');
      Security.addSuspicion && Security.addSuspicion(50, 'localStorage_tampered');
      return freshState();
    }

    // Sanitizar rangos
    const clean = window.Security
      ? Security.sanitizeLoadedState(parsed)
      : parsed;

    return clean || freshState();
  } catch (e) {
    return freshState();
  }
}

function saveState(s) {
  // Sellar estado antes de guardar
  if (window.Security) Security.sealState(s);

  // Guardar en localStorage (siempre, funciona offline)
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e) {}

  // Guardar en la nube si hay sesión (no bloquea)
  if (window.CloudSave && CloudSave.isLoggedIn()) {
    CloudSave.save(s).catch(e => console.warn('Cloud save:', e.message));
  }
}

// Carga asíncrona desde la nube (llamada desde main.js)
async function loadStateCloud() {
  // 1. Intentar cloud
  if (window.CloudSave && CloudSave.isLoggedIn()) {
    try {
      const cloud = await CloudSave.load();
      if (cloud) {
        const clean = window.Security
          ? Security.sanitizeLoadedState(cloud)
          : cloud;
        if (clean && clean.v === 1) {
          console.log('✅ Progreso cargado desde la nube');
          return clean;
        }
      }
    } catch (e) {
      console.warn('Cloud load falló, usando localStorage:', e.message);
    }
  }

  // 2. Fallback localStorage
  return loadState();
}
