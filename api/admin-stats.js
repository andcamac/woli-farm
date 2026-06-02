/* ═══════════════════════════════════════════
   GET /api/admin-stats
   Woli Farm · admin dashboard data source
   ═══════════════════════════════════════════
   Returns aggregate counts + recent audit logs.
   Admin-only: requires a valid Firebase ID token
   whose uid exists in the admins collection.

   This is the backend the Session-2 dashboard
   (admin.html) will consume.
═══════════════════════════════════════════ */
'use strict';

const { getAdmin } = require('./_lib/firebaseAdmin');
const { verifyToken, isAdmin } = require('./_lib/auth');

// How many user docs to read for token-sum aggregation. Counts (users,
// harvests, minted) use Firestore aggregation queries and are exact
// regardless of this cap.
const USER_READ_CAP = 1000;
const RECENT_LOG_LIMIT = 50;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const decoded = await verifyToken(req);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!(await isAdmin(decoded.uid))) {
    res.status(403).json({ error: 'Forbidden — admin only' });
    return;
  }

  const admin = getAdmin();
  const db = admin.firestore();

  try {
    // ── Exact counts via aggregation queries ──
    const [usersCount, harvestsCount, mintedCount] = await Promise.all([
      db.collection('users').count().get(),
      db.collectionGroup('harvests').count().get(),
      db.collectionGroup('harvests').where('minted', '==', true).count().get(),
    ]);

    // ── Token + cycle sums (read capped set of user docs) ──
    const usersSnap = await db.collection('users').limit(USER_READ_CAP).get();
    let woliBalance = 0, woliEarned = 0, woliSpent = 0, cyclesCompleted = 0;
    usersSnap.forEach((d) => {
      const u  = d.data();
      const gs = u.gameState || {};
      woliBalance     += Number(u.coins || 0);
      cyclesCompleted += Number(u.totalCyclesCompleted || 0);
      woliEarned      += Number(gs.coinsEarned || 0);
      woliSpent       += Number(gs.coinsSpent || 0);
    });

    // ── Recent audit feed (with IP) ──
    const logsSnap = await db
      .collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(RECENT_LOG_LIMIT)
      .get();

    const recentLogs = logsSnap.docs.map((d) => {
      const l = d.data();
      return {
        id:        d.id,
        uid:       l.uid,
        email:     l.email || null,
        action:    l.action,
        ip:        l.ip || null,
        geo:       l.geo || null,
        userAgent: l.userAgent || null,
        meta:      l.meta || {},
        timestamp: l.timestamp ? l.timestamp.toMillis() : null,
      };
    });

    res.status(200).json({
      totals: {
        users:             usersCount.data().count,
        harvests:          harvestsCount.data().count,
        nftsMinted:        mintedCount.data().count,
        cyclesCompleted,
        woliInCirculation: woliBalance,
        woliEarned,
        woliSpent,
        usersSampled:      usersSnap.size, // transparency: sums cover this many docs
      },
      recentLogs,
      generatedAt: Date.now(),
    });
  } catch (e) {
    res.status(500).json({ error: 'Stats query failed', detail: e.message });
  }
};
