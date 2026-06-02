/* ═══════════════════════════════════════════
   POST /api/log-event
   Woli Farm · audit logging
   ═══════════════════════════════════════════
   Captures a server-validated IP + geo + user agent
   for an authenticated user action and writes an
   immutable record to the audit_logs collection.

   The client CANNOT write audit_logs directly
   (Firestore rules deny it); only this function,
   using the Admin SDK, can.

   Body: { action: string, meta?: object }
   Header: Authorization: Bearer <firebase id token>
═══════════════════════════════════════════ */
'use strict';

const { getAdmin } = require('./_lib/firebaseAdmin');
const { getClientIp, getGeo } = require('./_lib/ip');
const { verifyToken } = require('./_lib/auth');

// Whitelist of auditable actions. Unknown actions are rejected so the
// log can't be polluted with arbitrary strings.
const ALLOWED_ACTIONS = new Set([
  'login',
  'signup',
  'logout',
  'plant',
  'harvest',
  'purchase',
  'mint_request',
  'mint_success',
  'mint_failed',
  'page_view',
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await verifyToken(req);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const action = String(body.action || '').slice(0, 40);
  if (!ALLOWED_ACTIONS.has(action)) {
    res.status(400).json({ error: 'Invalid action' });
    return;
  }

  const admin = getAdmin();
  const entry = {
    uid:       decoded.uid,
    email:     decoded.email || null,
    action,
    ip:        getClientIp(req),
    geo:       getGeo(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
    meta:      sanitizeMeta(body.meta),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await admin.firestore().collection('audit_logs').add(entry);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Log write failed' });
  }
};

// Only allow primitive values, cap key count and string length, so the
// meta blob stays small and predictable.
function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const out = {};
  let count = 0;
  for (const k of Object.keys(meta)) {
    if (count++ >= 20) break;
    const v = meta[k];
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) {
      out[String(k).slice(0, 40)] = typeof v === 'string' ? v.slice(0, 200) : v;
    }
  }
  return out;
}
