# 🛠 Session 1 — Serverless Audit Layer + Admin Role

This session adds the secure foundation that **both** the admin dashboard
(Session 2) and real on-chain minting (Session 3+) depend on:

- A **Vercel serverless layer** (`/api`) — the only place that can hold secrets
  and read a trustworthy IP.
- An immutable **`audit_logs`** collection (server-written only).
- **Server-side IP + geo capture** on every audited action.
- An **admin role** enforced in Firestore rules and in the serverless layer.

Nothing here costs money and nothing touches a blockchain yet.

---

## What got added / changed

**New files**
```
api/_lib/firebaseAdmin.js   Admin SDK initializer (reads service account from env)
api/_lib/ip.js              IP + geo extraction from request headers
api/_lib/auth.js            ID-token verification + admin check
api/log-event.js            POST endpoint — writes IP-stamped audit logs
api/admin-stats.js          GET endpoint — admin-only aggregate stats (dashboard backend)
js/audit.js                 Client helper: Audit.log(action, meta)
package.json                Declares firebase-admin so Vercel installs it
.gitignore                  Keeps secrets / node_modules out of git
SETUP_SESSION1.md           This file
```

**Modified files**
```
firestore.rules             + admin role, + audit_logs lockdown, + admin reads
index.html                  loads js/audit.js before js/farm.js
auth.html                   loads js/audit.js + logs 'login'
js/farm.js                  logs 'plant', 'purchase', 'harvest'
```
