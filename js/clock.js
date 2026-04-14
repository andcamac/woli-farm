/* ═══════════════════════════════════════════
   CLOCK — Real-Time Engine & Task Scheduling
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */

'use strict';

const Clock = (() => {

  let _state   = null;
  let _ticker  = null;
  let _onTick  = null;    // callback(state) called every second
  let _onDay   = null;    // callback(state, newDay) on day transition

  // ── Get real local time components ────────
  function now()     { return new Date(); }
  function hour()    { return now().getHours(); }
  function minute()  { return now().getMinutes(); }
  function second()  { return now().getSeconds(); }
  function dateKey() { const d = now(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

  // ── Compute how many game days have elapsed since cycle start ──
  function elapsedDays(state) {
    if (!state.cycleActive || !state.cycleStartTime) return 0;
    const ms = Date.now() - state.cycleStartTime;
    return Math.floor(ms / 86400000); // ms per day
  }

  // ── Generate today's tasks at random minutes within windows ──
  function generateDayTasks(state) {
    const dk = dateKey();
    if (state.lastDayChecked === dk) return; // already generated today
    state.lastDayChecked = dk;
    state.dayWaters   = 0;
    state.dayFert     = 0;
    state.dayPerfect  = false;
    state.todayOnTime = { w: [false,false,false], f: [false] };

    const tasks = [];

    // Schedule 3 water tasks at each window hour + random offset (0–30 min)
    CFG.WATER_WINDOWS.forEach((wh, i) => {
      const offsetMin = Math.floor(Math.random() * 30);
      const fireMin   = wh * 60 + offsetMin;         // minutes from midnight
      tasks.push({
        id:       `water_${i}`,
        type:     'water',
        index:    i,
        fireMin,                                      // when to show notification
        deadlineMin: fireMin + CFG.TASK_WINDOW_MINS,  // last minute for on-time
        expiryMin:   fireMin + CFG.TASK_LATE_MINS,    // after this: missed
        status:   'pending',   // pending | notified | done_ontime | done_late | missed
        notified: false,
      });
    });

    // Schedule fertilizer task
    CFG.FERT_WINDOW.forEach((fh, i) => {
      const offsetMin = Math.floor(Math.random() * 30);
      const fireMin   = fh * 60 + offsetMin;
      tasks.push({
        id:       `fert_${i}`,
        type:     'fert',
        index:    i,
        fireMin,
        deadlineMin: fireMin + CFG.TASK_WINDOW_MINS,
        expiryMin:   fireMin + CFG.TASK_LATE_MINS,
        status:   'pending',
        notified: false,
      });
    });

    state.tasks = tasks;
  }

  // ── Current minutes from midnight ─────────
  function minutesNow() {
    const d = now();
    return d.getHours() * 60 + d.getMinutes();
  }

  // ── Tick: called every second ──────────────
  function tick() {
    if (!_state || !_state.cycleActive) {
      if (_onTick) _onTick(_state);
      return;
    }

    const mins    = minutesNow();
    const dayNow  = elapsedDays(_state) + 1; // day 1–7

    // ── Day transition ──
    if (dayNow !== _state.cycleDay && dayNow <= CFG.CYCLE_DAYS) {
      const prevDay = _state.cycleDay;
      _state.cycleDay = dayNow;

      // Score previous day before resetting
      if (prevDay > 0) {
        Econ.scorePreviousDay(_state, prevDay);
      }

      generateDayTasks(_state);

      if (_onDay) _onDay(_state, dayNow);
    }

    // ── Day 7 complete ──
    if (dayNow > CFG.CYCLE_DAYS && !_state.cycleComplete) {
      _state.cycleComplete = true;
      Econ.scorePreviousDay(_state, 7);
      if (_onDay) _onDay(_state, 8); // signal harvest
    }

    // ── Process task notifications & expiry ──
    _state.tasks.forEach(task => {
      if (task.status === 'pending' && mins >= task.fireMin && !task.notified) {
        task.notified = true;
        task.status   = 'notified';
        Notifications.fire(task);
      }
      if (task.status === 'notified' && mins >= task.expiryMin) {
        task.status = 'missed';
        Notifications.dismiss(task.id);
        _handleMissedTask(task);
      }
    });

    saveState(_state);
    if (_onTick) _onTick(_state);
  }

  function _handleMissedTask(task) {
    const penalty = task.type === 'water'
      ? CFG.HEALTH_DECAY_MISSED_WATER
      : CFG.HEALTH_DECAY_MISSED_FERT;
    _state.health = Math.max(CFG.HEALTH_MIN, _state.health - penalty);
  }

  // ── Public API ─────────────────────────────
  function start(state, onTick, onDay) {
    _state  = state;
    _onTick = onTick;
    _onDay  = onDay;
    generateDayTasks(state);
    if (_ticker) clearInterval(_ticker);
    _ticker = setInterval(tick, 1000);
    tick(); // immediate first tick
  }

  function stop() {
    clearInterval(_ticker);
    _ticker = null;
  }

  function getState()     { return _state; }
  function setState(s)    { _state = s; }
  function getDayNow()    { return elapsedDays(_state) + 1; }
  function getMinutesNow(){ return minutesNow(); }
  function getHour()      { return hour(); }
  function getDateKey()   { return dateKey(); }

  // Complete a task (called when player acts)
  function completeTask(state, type) {
    const mins     = minutesNow();
    const pending  = state.tasks.filter(t => t.type === type && (t.status === 'notified' || t.status === 'pending'));
    if (!pending.length) return 'none';  // no active task for this type

    const task  = pending[0];
    const onTime = mins <= task.deadlineMin;
    task.status  = onTime ? 'done_ontime' : 'done_late';
    if (onTime) {
      if (type === 'water') state.todayOnTime.w[task.index] = true;
      else                  state.todayOnTime.f[task.index] = true;
    }
    Notifications.dismiss(task.id);
    return onTime ? 'ontime' : 'late';
  }

  // Check if there's a currently active (notified) task of this type
  function hasActiveTask(state, type) {
    return state.tasks.some(t => t.type === type && t.status === 'notified');
  }

  // How many minutes left on the active task
  function taskTimeLeft(state, type) {
    const t = state.tasks.find(t => t.type === type && t.status === 'notified');
    if (!t) return null;
    return t.deadlineMin - minutesNow();
  }

  return { start, stop, getState, setState, getDayNow, getMinutesNow,
           getHour, getDateKey, completeTask, hasActiveTask, taskTimeLeft };
})();
