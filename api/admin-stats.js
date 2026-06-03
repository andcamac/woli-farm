/* ═══════════════════════════════════════════
   GET /api/admin-stats
   Woli Farm · admin dashboard data source
   ═══════════════════════════════════════════
   Returns aggregate counts + recent audit logs.
   Admin-only: requires a valid Firebase ID token
   whose uid exists in the admins collection.

   INDEX-FREE: derives every number from plain
   document reads (no collection-group queries,
   no aggregation queries) so it works without any
   manually-created Firestore indexes.
═══════════════════════════════════════════ */
'use strict';

const { getAdmin } = require('./_lib/firebaseAdmin');
const { verifyToken, isAdmin } = require('./_lib/auth');

// How many user docs to scan. Counts cover this many users; for a demo /
// small player base this is effectively the full set. For large scale we'd
// switch to maintained counters (a later optimization).
const USER_READ_CAP   = 2000;
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
    // ── Read user docs (single, index-free query) ──
    const usersSnap = await db.collection('users').limit(USER_READ_CAP).get();

    // Players each start with this many WOLI (CFG.START_COINS / ensureUserDoc).
    const START_COINS = 80;

    let woliBalance = 0, cyclesCompleted = 0, inProgressEarned = 0;
    usersSnap.forEach((d) => {
      const u  = d.data();
      const gs = u.gameState || {};
      woliBalance     += Number(u.coins || 0);
      cyclesCompleted += Number(u.totalCyclesCompleted || 0);
      // gameState.coinsEarned resets each cycle, so only count it while a
      // cycle is actually in progress (its earnings aren't in a harvest yet).
      if (gs.cycleActive === true) inProgressEarned += Number(gs.coinsEarned || 0);
    });

    // ── Harvest counts + global earned via each user's harvests subcollection ──
    // (direct subcollection reads need NO manual index)
    let totalHarvests = 0, totalMinted = 0, harvestEarned = 0;
    const perUser = await Promise.all(
      usersSnap.docs.map(async (d) => {
        try {
          const h = await d.ref.collection('harvests')
            .select('minted', 'coinsEarned', 'adminGenerated').get();
          let minted = 0, earned = 0;
          h.forEach((x) => {
            if (x.get('minted') === true) minted++;
            // Exclude admin-generated test NFTs from player economy figures.
            if (x.get('adminGenerated') !== true) earned += Number(x.get('coinsEarned') || 0);
          });
          return { total: h.size, minted, earned };
        } catch (e) {
          return { total: 0, minted: 0, earned: 0 };
        }
      })
    );
    perUser.forEach((c) => {
      totalHarvests += c.total;
      totalMinted   += c.minted;
      harvestEarned += c.earned;
    });

    // Global lifetime earned = all harvested cycles + the current in-progress cycle.
    const woliEarned = harvestEarned + inProgressEarned;
    // Accounting identity: balance = start + earned - spent  →  spent = start + earned - balance.
    const woliSpent = Math.max(0, START_COINS * usersSnap.size + woliEarned - woliBalance);

    // ── Recent audit feed (isolated so a feed hiccup can't blank the cards) ──
    let recentLogs = [];
    try {
      const logsSnap = await db
        .collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .limit(RECENT_LOG_LIMIT)
        .get();

      recentLogs = logsSnap.docs.map((d) => {
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
    } catch (e) {
      // Leave recentLogs empty; totals still return.
    }

    res.status(200).json({
      totals: {
        users:             usersSnap.size,
        harvests:          totalHarvests,
        nftsMinted:        totalMinted,
        cyclesCompleted,
        woliInCirculation: woliBalance,
        woliEarned,
        woliSpent,
        usersSampled:      usersSnap.size,
      },
      recentLogs,
      generatedAt: Date.now(),
    });
  } catch (e) {
    res.status(500).json({ error: 'Stats query failed', detail: e.message });
  }
};
