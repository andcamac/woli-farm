/* ═══════════════════════════════════════════
   FIREBASE ADMIN — shared initializer
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   Reads the service-account JSON from the
   FIREBASE_SERVICE_ACCOUNT environment variable
   (set in Vercel → Project → Settings → Environment
   Variables). NEVER commit the service account.
═══════════════════════════════════════════ */
'use strict';

const admin = require('firebase-admin');

function getAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
    }

    // Vercel env vars escape newlines in the private key; restore them.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

module.exports = { getAdmin };
