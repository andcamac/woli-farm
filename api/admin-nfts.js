/* ═══════════════════════════════════════════
   GET /api/admin-nfts
   Woli Farm · admin NFT gallery data source
   ═══════════════════════════════════════════
   Returns minted NFTs (across all users) with the
   attributes needed to render their SVG card.
   Admin-only. Index-free (direct subcollection reads).
═══════════════════════════════════════════ */
'use strict';

const { getAdmin } = require('./_lib/firebaseAdmin');
const { verifyToken, isAdmin } = require('./_lib/auth');

const USER_READ_CAP = 2000;
const MAX_NFTS = 120;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const decoded = await verifyToken(req);
  if (!decoded) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!(await isAdmin(decoded.uid))) { res.status(403).json({ error: 'Forbidden — admin only' }); return; }

  const admin = getAdmin();
  const db = admin.firestore();

  try {
    const usersSnap = await db.collection('users').limit(USER_READ_CAP).get();
    const all = [];

    await Promise.all(usersSnap.docs.map(async (d) => {
      try {
        const hs = await d.ref.collection('harvests').get();
        hs.forEach((x) => {
          const h = x.data();
          if (h.minted !== true) return;
          all.push({
            id:             x.id,
            ownerName:      h.ownerName || null,
            tokenId:        h.tokenId || null,
            onChainTokenId: h.onChainTokenId || null,
            rarityLabel:    h.rarityLabel || null,
            rarityColor:    h.rarityColor || null,
            rarityPct:      h.rarityPct || 0,
            health:         h.health || 0,
            perfectDays:    h.perfectDays || 0,
            maxStreak:      h.maxStreak || 0,
            coinsEarned:    h.coinsEarned || 0,
            chain:          h.chain || null,
            explorerUrl:    h.explorerUrl || null,
            adminGenerated: h.adminGenerated === true,
            mintedAt:       (h.mintedAt && h.mintedAt.toMillis) ? h.mintedAt.toMillis() : 0,
          });
        });
      } catch (e) { /* skip user on error */ }
    }));

    all.sort((a, b) => b.mintedAt - a.mintedAt);

    res.status(200).json({ nfts: all.slice(0, MAX_NFTS), total: all.length, generatedAt: Date.now() });
  } catch (e) {
    res.status(500).json({ error: 'NFT list failed', detail: e.message });
  }
};
