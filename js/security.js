/* ═══════════════════════════════════════════
   SECURITY — Anti-Cheat System
   Woli Farm · Web3 Demo
   Adaptado a los campos reales de state.js:
   coins, water, fert, seeds, health, etc.
═══════════════════════════════════════════ */
'use strict';

const Security = (() => {

  const HMAC_SECRET        = 'wf_2024_integrity';
  const MAX_COINS          = 10000;
  const MAX_DELTA          = 400;
  const ACTION_COOLDOWN_MS = 500;
  const CLOCK_DRIFT_MAX_MS = 30000;

  let _serverTimeOffset = 0;
  let _lastActionTime   = 0;
  let _usedTokens       = new Set();
  let _suspicion        = 0;
  let _sessionId        = _uid(16);
  let _initialized      = false;

  /* ── INIT ── */
  async function init() {
    if (_initialized) return;
    _initialized = true;

    // Cargar tokens usados
    try {
      const raw = localStorage.getItem('woli_used_tokens');
      if (raw) _usedTokens = new Set(JSON.parse(raw));
    } catch (_) {}

    // Sincronizar tiempo con servidor
    await _syncTime();
    setInterval(_syncTime, 5 * 60 * 1000);

    console.log('%c🔒 Woli Farm Security activo', 'color:#4caf78;font-weight:bold');
  }

  /* ── TIEMPO CONFIABLE ── */
  async function _syncTime() {
    try {
      if (!window.db || !window.firebase) return;
      const ref = db.collection('_time_sync').doc('probe');
      await ref.set({ t: firebase.firestore.FieldValue.serverTimestamp() });
      const snap = await ref.get();
      const serverTs = snap.data().t.toMillis();
      _serverTimeOffset = serverTs - Date.now();
      if (Math.abs(_serverTimeOffset) > CLOCK_DRIFT_MAX_MS) {
        _flag(25, `clock_drift:${_serverTimeOffset}ms`);
      }
      await ref.delete().catch(() => {});
    } catch (_) {}
  }

  function trustedTime() { return Date.now() + _serverTimeOffset; }

  /* ── TOKEN DE ACCIÓN (replay prevention) ── */
  function _makeToken(action) {
    const uid = window.CloudSave?.getCurrentUser()?.uid || 'anon';
    return btoa(`${action}:${uid}:${trustedTime()}:${_sessionId}:${Math.random()}`).slice(0, 22);
  }

  function _consumeToken(token) {
    if (_usedTokens.has(token)) { _flag(50, `replay:${token}`); return false; }
    _usedTokens.add(token);
    if (_usedTokens.size > 500) {
      _usedTokens = new Set(Array.from(_usedTokens).slice(-200));
    }
    try { localStorage.setItem('woli_used_tokens', JSON.stringify([..._usedTokens])); } catch (_) {}
    return true;
  }

  /* ── VALIDAR ACCIÓN (llama antes de water/fert/buy) ── */
  function validateAction(type, state) {
    // Rate limit
    const now = trustedTime();
    if (now - _lastActionTime < ACTION_COOLDOWN_MS) {
      _flag(5, 'rate_limit');
      return { ok: false, reason: 'Muy rápido, esperá un momento.' };
    }
    _lastActionTime = now;

    // Estado válido
    if (!state || typeof state.coins !== 'number') {
      _flag(20, 'invalid_state');
      return { ok: false, reason: 'Estado del juego inválido.' };
    }

    // Coins en rango
    if (state.coins > MAX_COINS || state.coins < -500) {
      _flag(100, `coins_oor:${state.coins}`);
      return { ok: false, reason: 'Balance fuera de rango.' };
    }

    // Integridad del estado
    if (!_verifyHash(state)) {
      _flag(80, 'state_hash_fail');
      return { ok: false, reason: 'Estado comprometido.' };
    }

    const token = _makeToken(type);
    return { ok: true, token };
  }

  function consumeToken(token) { return _consumeToken(token); }

  /* ── VALIDAR DELTA DE COINS ── */
  function validateDelta(delta, ctx) {
    if (typeof delta !== 'number' || isNaN(delta)) { _flag(30, `bad_delta:${ctx}`); return 0; }
    if (delta > MAX_DELTA) { _flag(40, `delta_large:${delta}:${ctx}`); return MAX_DELTA; }
    return delta;
  }

  /* ── HASH DE INTEGRIDAD (djb2) ── */
  // Campos críticos mapeados a los nombres reales de state.js
  function _hashState(s) {
    const critical = JSON.stringify({
      coins:    s.coins,
      water:    s.water,
      fert:     s.fert,
      seeds:    s.seeds,
      health:   s.health,
      cycleDay: s.cycleDay,
      dayWaters:s.dayWaters,
      dayFert:  s.dayFert,
      perfectDays: s.perfectDays,
      totalCyclesCompleted: s.totalCyclesCompleted
    }) + HMAC_SECRET;

    let h = 5381;
    for (let i = 0; i < critical.length; i++) {
      h = ((h << 5) + h) ^ critical.charCodeAt(i);
      h = h >>> 0;
    }
    return h.toString(36);
  }

  function sealState(s) {
    s._integrity = _hashState(s);
    s._ts = trustedTime();
    return s;
  }

  function _verifyHash(s) {
    if (!s._integrity) return true; // estado nuevo sin hash aún
    return s._integrity === _hashState(s);
  }

  function verifyStateIntegrity(s) { return _verifyHash(s); }

  /* ── PROTEGER PROPIEDADES CRÍTICAS ── */
  // Usa los nombres reales de state.js: coins, health
  function protectStateObject(s) {
    ['coins', 'health', 'totalCyclesCompleted'].forEach(key => {
      let _v = s[key];
      Object.defineProperty(s, key, {
        get() { return _v; },
        set(newVal) {
          const stack = new Error().stack || '';
          const ok = stack.includes('economy.js') || stack.includes('farm.js') ||
                     stack.includes('state.js')   || stack.includes('clock.js') ||
                     stack.includes('security.js');
          if (!ok) {
            _flag(90, `direct_set:${key}=${newVal}`);
            console.warn(`🚫 Woli Farm: State.${key} no se puede modificar directamente.`);
            return;
          }
          _v = newVal;
        },
        configurable: true, enumerable: true
      });
    });
  }

  /* ── SANITIZAR ESTADO AL CARGAR ── */
  // Clampea todos los campos de freshState() a rangos válidos
  function sanitizeLoadedState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const s = { ...raw };

    const clamp = (v, min, max, def) =>
      (typeof v === 'number' && !isNaN(v)) ? Math.max(min, Math.min(max, Math.floor(v))) : def;

    s.coins              = clamp(s.coins,              -500,  MAX_COINS, 80);
    s.water              = clamp(s.water,              0,     99,        0);
    s.fert               = clamp(s.fert,               0,     99,        0);
    s.seeds              = clamp(s.seeds,              0,     99,        0);
    s.health             = clamp(s.health,             0,     100,       100);
    s.cycleDay           = clamp(s.cycleDay,           0,     7,         0);
    s.dayWaters          = clamp(s.dayWaters,          0,     3,         0);
    s.dayFert            = clamp(s.dayFert,            0,     1,         0);
    s.perfectDays        = clamp(s.perfectDays,        0,     7,         0);
    s.streakDays         = clamp(s.streakDays,         0,     7,         0);
    s.maxStreak          = clamp(s.maxStreak,          0,     7,         0);
    s.totalCyclesCompleted = clamp(s.totalCyclesCompleted, 0, 9999,      0);

    return s;
  }

  /* ── SISTEMA DE SOSPECHA ── */
  function _flag(pts, reason) {
    _suspicion += pts;
    console.warn(`🚩 Security: ${reason} (+${pts} → total ${_suspicion})`);
    _report(reason, pts);
    if (_suspicion >= 200) _blockSession();
    else if (_suspicion >= 100) _warnUser();
  }

  async function _report(reason, pts) {
    try {
      const user = window.CloudSave?.getCurrentUser();
      if (!user || !window.db) return;
      await db.collection('security_logs').add({
        uid: user.uid, reason, pts,
        total: _suspicion,
        session: _sessionId,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (_) {}
  }

  function _warnUser() {
    const t = document.getElementById('toast');
    if (t) { t.textContent = '⚠️ Actividad inusual detectada.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
  }

  function _blockSession() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,31,16,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f5f0e8;font-family:DM Sans,sans-serif;text-align:center;padding:2rem';
    el.innerHTML = `<div style="font-size:3rem;margin-bottom:1rem">🔒</div>
      <div style="font-family:Playfair Display,serif;font-size:1.6rem;color:#e05050;margin-bottom:.5rem">Sesión Suspendida</div>
      <div style="opacity:.7;max-width:320px;line-height:1.6;margin-bottom:2rem">Se detectó actividad sospechosa. Tu progreso fue reseteado por seguridad.</div>
      <button onclick="location.reload()" style="padding:.8rem 2rem;background:#2d7a4f;color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer">Recargar</button>`;
    document.body.appendChild(el);
  }

  /* ── HELPERS ── */
  function _uid(len) {
    return Array.from({ length: len }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
  }

  return {
    init,
    trustedTime,
    validateAction,
    consumeToken,
    validateDelta,
    sealState,
    verifyStateIntegrity,
    sanitizeLoadedState,
    protectStateObject
  };

})();

document.addEventListener('DOMContentLoaded', () => {
  Security.init().catch(e => console.warn('Security init:', e));
});
