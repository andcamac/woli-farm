/* ═══════════════════════════════════════════
   AUDIT — client hook to the serverless logger
   Woli Farm
   ═══════════════════════════════════════════
   Sends an authenticated action to /api/log-event,
   where the SERVER stamps the real IP, geo and user
   agent. Fire-and-forget: never blocks gameplay and
   never throws into the caller.

   Usage:  Audit.log('harvest', { tokenId: 12 });
═══════════════════════════════════════════ */
'use strict';

const Audit = (() => {
  const ENDPOINT = '/api/log-event';

  async function log(action, meta) {
    try {
      if (typeof firebase === 'undefined' || !firebase.auth) return;
      const user = firebase.auth().currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ action, meta: meta || {} }),
        keepalive: true, // lets the request survive page navigation (logout/unload)
      });
    } catch (e) {
      // Audit logging must never break the game.
      console.warn('Audit log failed:', e && e.message);
    }
  }

  return { log };
})();
