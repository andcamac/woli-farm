/* ═══════════════════════════════════════════
   MAIN — Boot Sequence
   Woli Farm · Web3 Demo
   v2: Cloud Save + User Badge integrado
═══════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {

  // 1. Cargar estado (cloud si hay sesión, si no localStorage)
  const state = await loadStateCloud();

  // 2. Proteger propiedades críticas con anti-cheat
  if (window.Security) Security.protectStateObject(state);

  // 3. Init farm logic
  Farm.init(state);

  // 4. Build scene
  initStars();
  initClouds();
  initGrass();

  // 5. Start real-time clock
  Clock.start(state,
    (s) => UI.render(s),
    (s, day) => Farm.onDayChange(s, day)
  );

  // 6. Initial render
  UI.render(state);
  UI.log(state, '🌿 Woli Farm iniciado — ciclo de 7 días reales', '');

  if (state.cycleActive) {
    UI.log(state, `📅 Ciclo activo — Día ${state.cycleDay}/7`, 'day');
  } else {
    UI.log(state, `💰 Balance: ${state.coins} WOLI · Semillas: ${state.seeds}`, 'good');
  }

  // 7. Inyectar badge de usuario en el header
  _injectUserBadge();

  // 8. Request notification permission on first interaction
  document.body.addEventListener('click', () => {
    Notifications.requestPermission();
  }, { once: true });
});

/* ── User badge en el header ── */
function _injectUserBadge() {
  if (typeof firebase === 'undefined') return;

  firebase.auth().onAuthStateChanged(function(user) {
    const slot = document.getElementById('user-badge-slot');
    if (!slot) return;

    if (user) {
      const name     = (user.displayName || user.email.split('@')[0]).split(' ')[0];
      const initials = (user.displayName || 'W').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const avatar   = user.photoURL
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1a4a28&color=6ee0a0&size=64&bold=true`;

      slot.innerHTML =
        `<a href="auth.html" title="Mi cuenta" style="` +
        `display:flex;align-items:center;gap:7px;padding:4px 10px 4px 4px;margin-right:8px;` +
        `background:rgba(77,184,122,0.12);border:1px solid rgba(77,184,122,0.25);` +
        `border-radius:20px;text-decoration:none;cursor:pointer;">` +
          `<img src="${avatar}" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1px solid rgba(77,184,122,0.4);">` +
          `<span style="font-size:.72rem;color:rgba(245,240,232,.75);font-family:var(--font-b);max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>` +
        `</a>`;
    } else {
      slot.innerHTML =
        `<a href="auth.html" title="Iniciar sesión" style="` +
        `display:flex;align-items:center;gap:5px;padding:4px 10px;margin-right:8px;` +
        `background:transparent;border:1px solid rgba(77,184,122,0.2);border-radius:20px;` +
        `text-decoration:none;font-size:.72rem;color:rgba(245,240,232,.45);font-family:var(--font-b);">` +
        `👤 Iniciar sesión</a>`;
    }
  });
}
