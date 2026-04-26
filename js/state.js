/* ═══════════════════════════════════════════
   STATE — Cloud-First Persistence
   Woli Farm · Web3 Demo
   v2: Firestore primary, localStorage fallback
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
    dayHistory:           [],
    totalCyclesCompleted: 0,
  };
}

/* ── CLOUD SAVE: debounced para no saturar Firestore ── */
let _saveTimer = null;
let _saveQueue = null;
const SAVE_DEBOUNCE_MS = 1500;

function _writeToCloud(state) {
  if (typeof firebase === 'undefined') return Promise.resolve();
  const user = firebase.auth().currentUser;
  if (!user) return Promise.resolve();

  const db = firebase.firestore();
  return db.collection('users').doc(user.uid).set({
    coins:                state.coins ?? 0,
    totalCyclesCompleted: state.totalCyclesCompleted ?? 0,
    gameState:            state,
    savedAt:              firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

/* ── SAVE: localStorage inmediato + cloud debounced ── */
function saveState(s) {
  // Save local inmediato (rápido, offline support)
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e) {}

  // Cloud save con debounce — guarda 1.5s después del último cambio
  _saveQueue = s;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    if (_saveQueue) {
      _writeToCloud(_saveQueue).catch(err => {
        console.warn('Cloud save failed (using localStorage):', err.message);
      });
      _saveQueue = null;
    }
  }, SAVE_DEBOUNCE_MS);
}

/* ── LOAD: prioriza cloud, fallback localStorage ── */
async function loadState() {
  // 1. Si hay usuario logueado, intentar cargar de Firestore
  if (typeof firebase !== 'undefined') {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        const db = firebase.firestore();
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          if (data.gameState && data.gameState.v === 1) {
            console.log('✅ Progreso cargado desde la nube');
            try { localStorage.setItem(STATE_KEY, JSON.stringify(data.gameState)); } catch(e) {}
            return data.gameState;
          }
        }
      } catch (e) {
        console.warn('Cloud load failed, fallback localStorage:', e.message);
      }
    }
  }

  // 2. Fallback: localStorage
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return freshState();
    return s;
  } catch (e) {
    return freshState();
  }
}

/* ── FORCE SAVE: úsalo en momentos críticos (cosecha, reset, plantar) ── */
function flushSave(s) {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  _saveQueue = null;
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e) {}
  return _writeToCloud(s);
}

/* ── BEFORE UNLOAD: guarda lo que esté en cola ── */
window.addEventListener('beforeunload', () => {
  if (_saveQueue) {
    // Sincrono al localStorage
    try { localStorage.setItem(STATE_KEY, JSON.stringify(_saveQueue)); } catch(e) {}
    // Cloud no se garantiza pero intenta
    _writeToCloud(_saveQueue).catch(() => {});
  }
});
