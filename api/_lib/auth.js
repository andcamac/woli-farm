/* ═══════════════════════════════════════════
   AUTH — token verification & admin check
   Woli Farm · serverless layer
   ═══════════════════════════════════════════ */
'use strict';

const { getAdmin } = require('./firebaseAdmin');

// Verify the Firebase ID token sent in the Authorization header.
// Returns the decoded token (with uid, email, ...) or null.
async function verifyToken(req) {
  const header = req.headers['authorization'] || '';
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) return null;
  try {
    const admin = getAdmin();
    return await admin.auth().verifyIdToken(match[1]);
  } catch (e) {
    return null;
  }
}

// A user is an admin iff a doc exists at admins/{uid}.
// Provisioned manually in the Firebase console (see SETUP_SESSION1.md).
async function isAdmin(uid) {
  const admin = getAdmin();
  const doc = await admin.firestore().collection('admins').doc(uid).get();
  return doc.exists;
}

module.exports = { verifyToken, isAdmin };
