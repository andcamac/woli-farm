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

--

---

## Notes & gotchas

- **The Firebase web API key in `js/firebase-config.js` is *not* a secret** and
  is fine to keep committed. The service account (Session 1) **is** a secret and
  lives only in Vercel env vars.
- **IP is captured server-side**, never trusted from the client — this is what
  makes the logs audit-grade.
- **Privacy:** IP addresses are personal data under GDPR and Costa Rica's
  Ley 8968. Logging them for security/audit is a legitimate basis, but you'll
  want a retention policy and a line in your privacy notice before launch.
  (Not legal advice.) A scheduled purge of old `audit_logs` can be added later.
- The `admin-stats` token sums read up to 1,000 user docs; counts of users /
  harvests / minted NFTs are exact at any scale via aggregation queries.

---
