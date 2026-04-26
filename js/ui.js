/* ═══════════════════════════════════════════
   UI — Render, Clock, Log, Toast, Modals
   Woli Farm · Web3 Demo
═══════════════════════════════════════════ */
'use strict';

const UI = (() => {

  let _toastTimer = null;

  // ── Toast ──────────────────────────────────
  function toast(msg, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ── Log ────────────────────────────────────
  function log(state, msg, type = '') {
    const container = document.getElementById('log');
    const line = document.createElement('div');
    line.className = `log-line ${type ? 'log-' + type : ''}`;
    const d = new Date();
    const ts = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    line.innerHTML = `<span class="log-ts">${ts}</span> ${msg}`;
    container.insertBefore(line, container.firstChild);
    while (container.children.length > 12) container.removeChild(container.lastChild);
  }

  function clearLog() { document.getElementById('log').innerHTML = ''; }

  // ── Clock display ──────────────────────────
  function updateClock(state) {
    const now  = new Date();
    const h    = String(now.getHours()).padStart(2,'0');
    const m    = String(now.getMinutes()).padStart(2,'0');
    document.getElementById('clock-h').textContent = h;
    document.getElementById('clock-m').textContent = m;

    // Day progress bar (fraction of current day elapsed)
    const dayFrac = (now.getHours() * 60 + now.getMinutes()) / 1440;
    document.getElementById('day-fill').style.width   = `${dayFrac * 100}%`;
    document.getElementById('day-marker').style.left  = `${dayFrac * 100}%`;
    document.getElementById('day-num').textContent    = state.cycleActive ? state.cycleDay : 0;
  }

  // ── Status cards ───────────────────────────
  function updateStatus(state) {
    document.getElementById('s-water').textContent  = `${state.dayWaters}/${CFG.WATERS_PER_DAY}`;
    document.getElementById('s-fert').textContent   = `${state.dayFert}/${CFG.FERTS_PER_DAY}`;
    document.getElementById('s-health').textContent = `${Math.round(state.health)}%`;
    document.getElementById('s-streak').textContent = state.streakDays;
    document.getElementById('wallet-display').textContent = state.coins;
  }

  // ── Progress bar & stage ───────────────────
  function updateProgress(state) {
    const day = Math.min(state.cycleDay, CFG.CYCLE_DAYS);
    const pct = Math.round((day / CFG.CYCLE_DAYS) * 100);
    document.getElementById('prog-fill').style.width = `${pct}%`;
    document.getElementById('prog-pct').textContent  = `${pct}%`;
    document.getElementById('p-day').textContent     = day;

    const stageData = CFG.STAGES[Math.min(state.stageIdx, CFG.STAGES.length - 1)];
    document.getElementById('stage-text').textContent = stageData
      ? stageData.name
      : 'Sin semilla';
  }

  // ── Action buttons ─────────────────────────
  function updateButtons(state) {
    const btnW = document.getElementById('btn-water');
    const btnF = document.getElementById('btn-fert');

    // Inventory display
    document.getElementById('inv-water').textContent = `x${state.water}`;
    document.getElementById('inv-fert').textContent  = `x${state.fert}`;

    // Water button
    const waterTaskActive = state.cycleActive
      && Clock.hasActiveTask(state, 'water')
      && state.dayWaters < CFG.WATERS_PER_DAY;
    const canWater = state.cycleActive
      && state.water > 0
      && state.dayWaters < CFG.WATERS_PER_DAY;

    if (!state.cycleActive) {
      btnW.className = state.seeds > 0 ? 'abtn abtn-plant' : 'abtn abtn-water';
      btnW.disabled = state.seeds < 1;
      btnW.querySelector('.abtn-icon').textContent  = '🌱';
      btnW.querySelector('.abtn-label').textContent = state.seeds > 0 ? 'Plantar Semilla' : 'Sin semillas';
      btnW.querySelector('.abtn-sub').textContent   = `x${state.seeds}`;
    } else if (!canWater) {
      btnW.className = 'abtn abtn-water abtn-done';
      btnW.disabled = true;
      btnW.querySelector('.abtn-label').textContent = state.dayWaters >= CFG.WATERS_PER_DAY ? 'Regado ✓' : 'Sin agua';
    } else {
      btnW.className = `abtn abtn-water ${waterTaskActive ? 'abtn-urgent' : ''}`;
      btnW.disabled = false;
      btnW.querySelector('.abtn-label').textContent = waterTaskActive ? '¡Regar AHORA!' : 'Regar';
    }

    // Fert button
    const fertTaskActive = state.cycleActive
      && Clock.hasActiveTask(state, 'fert')
      && state.dayFert < CFG.FERTS_PER_DAY;
    const canFert = state.cycleActive
      && state.fert > 0
      && state.dayFert < CFG.FERTS_PER_DAY;

    if (!state.cycleActive) {
      btnF.className = 'abtn abtn-fert';
      btnF.disabled = true;
      btnF.querySelector('.abtn-label').textContent = 'Fertilizar';
    } else if (!canFert) {
      btnF.className = 'abtn abtn-fert abtn-done';
      btnF.disabled = true;
      btnF.querySelector('.abtn-label').textContent = state.dayFert >= CFG.FERTS_PER_DAY ? 'Fertilizado ✓' : 'Sin fertilizante';
    } else {
      btnF.className = `abtn abtn-fert ${fertTaskActive ? 'abtn-urgent' : ''}`;
      btnF.disabled = false;
      btnF.querySelector('.abtn-label').textContent = fertTaskActive ? '¡Fertilizar AHORA!' : 'Fertilizar';
    }
  }

  // ── Task alerts ────────────────────────────
  function updateTaskAlerts(state) {
    const el = document.getElementById('task-alerts');
    const activeTasks = state.tasks
      ? state.tasks.filter(t => t.status === 'notified')
      : [];

    if (activeTasks.length === 0) { el.innerHTML = ''; return; }

    el.innerHTML = activeTasks.map(t => {
      const mins = Clock.taskTimeLeft(state, t.type);
      const timeStr = mins !== null
        ? (mins > 0 ? `${mins} min` : 'venciendo')
        : '';
      const isWater = t.type === 'water';
      return `<div class="task-alert task-${t.type}">
        <span>${isWater ? '💧' : '🌿'} ${isWater ? 'Regar ahora' : 'Fertilizar ahora'}</span>
        <span class="task-timer">${timeStr}</span>
      </div>`;
    }).join('');
  }

  // ── Soil moisture visual ───────────────────
  function updateSoilBar(state) {
    // Moisture: resets with each watering, drains over time
    const waterPct = Math.min(100, (state.dayWaters / CFG.WATERS_PER_DAY) * 100);
    document.getElementById('soil-fill').style.width = `${waterPct}%`;
  }

  // ── Harvest modal ──────────────────────────
  function showHarvest(state, harvestBonus, rarity) {
    const perfect = state.dayHistory.filter(d => d.perfect).length;
    document.getElementById('h-perfect').textContent  = `${perfect}/7`;
    document.getElementById('h-health').textContent   = `${Math.round(state.health)}%`;
    document.getElementById('h-streak').textContent   = state.maxStreak;
    document.getElementById('h-tokens').textContent   = `+${harvestBonus} (total: ${state.coins})`;
    document.getElementById('h-rarity').textContent   = rarity.label;
    document.getElementById('h-rarity').style.color   = rarity.color;
    document.getElementById('h-nft-rarity').textContent = rarity.label;
    document.getElementById('h-nft-rarity').style.color = rarity.color;
    document.getElementById('harvest-overlay').classList.add('show');
  }

  function hideHarvest() {
    document.getElementById('harvest-overlay').classList.remove('show');
  }

  // ── Shop modal ─────────────────────────────
  function openShop() {
    const state = Clock.getState();
    Shop.render(state);
    document.getElementById('shop-overlay').classList.add('show');
  }

  function openShopFromHarvest() {
    hideHarvest();
    openShop();
  }

  function closeShop(e) {
    if (e && e.target !== document.getElementById('shop-overlay')) return;
    closeShopBtn();
  }

  function closeShopBtn() {
    document.getElementById('shop-overlay').classList.remove('show');
  }

  // ── Full render ────────────────────────────
  function render(state) {
    updateClock(state);
    updateStatus(state);
    updateProgress(state);
    updateButtons(state);
    updateTaskAlerts(state);
    updateSoilBar(state);
    drawPlant(state.stageIdx, state.health);
    updateSky(state.cycleActive, new Date().getHours());
  }

  return {
    toast, log, clearLog, render,
    showHarvest, hideHarvest,
    openShop, openShopFromHarvest, closeShop, closeShopBtn
  };
})();
