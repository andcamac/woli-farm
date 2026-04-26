/* ═══════════════════════════════════════════
   STATE — Game State & Persistence
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */

'use strict';

const STATE_KEY = 'woli_farm_v1';

function freshState() {
  const now = Date.now();
  return {
    v: 1,

    // Cycle tracking
    cycleActive:    false,
    cycleStartTime: null,       // epoch ms when cycle started
    cycleDay:       0,          // 0 = not started, 1–7 = in progress
    cycleComplete:  false,

    // Daily progress (reset each real calendar day of cycle)
    dayWaters:      0,          // waterings done today
    dayFert:        0,          // fertilizations done today
    dayPerfect:     false,      // all tasks done on time today
    todayOnTime:    { w: [false,false,false], f: [false] }, // which tasks done on time

    // Across cycle
    perfectDays:    0,          // days all tasks completed on time
    streakDays:     0,          // consecutive perfect days
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
    coinsEarned:    0,          // lifetime earned this cycle
    coinsSpent:     0,

    // Notifications — scheduled task windows
    tasks:          [],         // array of task objects for today
    lastDayChecked: null,       // which calendar date we last generated tasks for

    // History
    dayHistory:     [],         // [{day, coins, perfect, health}]
    totalCyclesCompleted: 0,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return freshState();
    return s;
  } catch (e) { return freshState(); }
}

function saveState(s) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e) {}
}
