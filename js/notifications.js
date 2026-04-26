/* ═══════════════════════════════════════════
   NOTIFICATIONS — In-App Alert System
   Woli Farm · Web3 Demo
   v2: Fix de notificaciones repetidas
═══════════════════════════════════════════ */

'use strict';

const Notifications = (() => {

  const active = {};        // id → { countdown }
  const _firedThisSession = new Set();  // task IDs ya disparadas en esta sesión

  // ── Fire a task notification ───────────────
  function fire(task) {
    // Evitar disparar la misma tarea dos veces en la misma sesión
    if (_firedThisSession.has(task.id)) return;
    _firedThisSession.add(task.id);

    const isWater = task.type === 'water';
    const icon    = isWater ? '💧' : '🌿';
    const titles  = {
      water: ['¡Hora del riego!', '¡Tu planta tiene sed!', 'Tercer riego del día'],
      fert:  ['¡Fertilizar ahora!'],
    };
    const subs = {
      water: ['Riega tu planta para ganar 100 WOLI hoy', 'Segundo riego — ¡no pierdas la racha!', 'Último riego del día'],
      fert:  ['Aplica fertilizante para máximo crecimiento'],
    };
    const idx   = task.index || 0;
    const title = (titles[task.type] || ['Tarea lista'])[idx] || titles[task.type][0];
    const sub   = (subs[task.type]   || ['Completa la tarea'])[idx] || subs[task.type][0];
    const mins  = CFG.TASK_WINDOW_MINS;

    showNotif(task.id, icon, title, sub, mins);

    // Try browser Push notification as well (solo una vez por tarea)
    _tryPush(icon + ' ' + title, sub);
  }

  // ── Show the in-app notification bar ──────
  function showNotif(id, icon, title, sub, windowMins) {
    // Si ya hay un countdown activo para esta tarea, NO crear otro
    if (active[id] && active[id].countdown) {
      return;
    }

    const el = document.getElementById('notif');
    if (!el) return;

    document.getElementById('notif-icon').textContent  = icon;
    document.getElementById('notif-title').textContent = title;
    document.getElementById('notif-sub').textContent   = sub;
    document.getElementById('notif-timer').textContent = `⏱ ${windowMins}min`;
    el.className = 'notif-show';

    // Countdown timer display
    let remaining = windowMins * 60;
    const countdown = setInterval(() => {
      remaining--;
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      const timerEl = document.getElementById('notif-timer');
      if (timerEl) timerEl.textContent = `⏱ ${m}:${String(s).padStart(2,'0')}`;
      if (remaining <= 0) {
        clearInterval(countdown);
        dismiss(id);
      }
    }, 1000);

    active[id] = { countdown };

    // Pulse the action buttons
    _pulseButtons(id.startsWith('water') ? 'btn-water' : 'btn-fert');
  }

  // ── Dismiss a notification ─────────────────
  function dismiss(id) {
    if (active[id]) {
      clearInterval(active[id].countdown);
      delete active[id];
    }
    // If no more active notifications, hide bar
    if (Object.keys(active).length === 0) {
      const el = document.getElementById('notif');
      if (el) el.className = 'notif-hidden';
    }
  }

  function dismissAll() {
    Object.keys(active).forEach(id => dismiss(id));
  }

  // ── Reset cuando empieza un nuevo día ──────
  // Llamar desde clock.js cuando regenera tareas del día
  function resetDailyState() {
    _firedThisSession.clear();
    dismissAll();
  }

  // ── Pulse button hint ─────────────────────
  function _pulseButtons(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.add('pulse-alert');
    setTimeout(() => btn.classList.remove('pulse-alert'), 8000);
  }

  // ── Browser Push API ─────────────────────
  function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function _tryPush(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'woli-farm-' + Date.now(), // tag único para que no se reemplace
        requireInteraction: false
      });
    } catch(e) { /* silent */ }
  }

  return { fire, dismiss, dismissAll, requestPermission, resetDailyState,
           // Internal: marca una task como ya disparada (sin mostrar UI)
           _markFired: (id) => _firedThisSession.add(id) };
})();
