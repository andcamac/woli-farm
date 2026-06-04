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

/* ── SAVE: localStorage inmediato + cloud throttled ──
   NOTA: el reloj llama saveState() cada segundo mientras el ciclo está
   activo. La versión anterior reiniciaba el timer en cada llamada
   (debounce), así que con ticks de 1s < 1.5s el guardado a la nube NUNCA
   se disparaba. Ahora usamos throttle de borde de salida: el primer
   cambio agenda una escritura garantizada en ≤1.5s y los cambios
   posteriores actualizan la cola sin posponer la escritura. */
function saveState(s) {
  // Sello de tiempo monotónico para resolver conflictos local vs nube
  s._updatedAt = Date.now();

  // Save local inmediato (rápido, offline support)
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e) {}

  // Cloud save con throttle — NO reinicia el timer si ya hay uno pendiente
  _saveQueue = s;
  if (!_saveTimer) {
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      const q = _saveQueue;
      _saveQueue = null;
      if (q) {
        _writeToCloud(q).catch(err => {
          console.warn('Cloud save failed (using localStorage):', err.message);
        });
      }
    }, SAVE_DEBOUNCE_MS);
  }
}

/* ── LOAD: elige el estado MÁS RECIENTE entre nube y local ──
   La versión anterior siempre sobrescribía localStorage con la nube. Como
   las escrituras a la nube se estaban perdiendo (ver saveState), la nube
   solía tener un snapshot viejo SIN la semilla recién plantada, y al
   recargar borraba el progreso local. Ahora comparamos _updatedAt y
   ganamos con el más nuevo (last-write-wins). */
async function loadState() {
  // 1. Leer local primero
  let local = null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1) local = s;
    }
  } catch (e) { /* ignore corrupt local */ }

  // 2. Si hay usuario logueado, comparar con Firestore
  if (typeof firebase !== 'undefined') {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        const db = firebase.firestore();
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data  = doc.data();
          const cloud = (data.gameState && data.gameState.v === 1) ? data.gameState : null;
          if (cloud) {
            const cloudT = cloud._updatedAt || 0;
            const localT = local ? (local._updatedAt || 0) : -1;
            const chosen = (localT > cloudT) ? local : cloud;
            // Sincronizar localStorage con el ganador
            try { localStorage.setItem(STATE_KEY, JSON.stringify(chosen)); } catch(e) {}
            console.log(localT > cloudT
              ? '✅ Progreso local más reciente que la nube'
              : '✅ Progreso cargado desde la nube');
            return chosen;
          }
        }
      } catch (e) {
        console.warn('Cloud load failed, fallback localStorage:', e.message);
      }
    }
  }

  // 3. Fallback: local o estado nuevo
  return local || freshState();
}

/* ── FORCE SAVE: úsalo en momentos críticos (cosecha, reset, plantar) ── */
function flushSave(s) {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  _saveQueue = null;
  s._updatedAt = Date.now();
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
