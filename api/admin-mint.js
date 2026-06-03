/* ═══════════════════════════════════════════
   POST /api/admin-mint
   Woli Farm · Admin-only mint (Optimized Version)
   Uses the new cheap safeMintTest function
═══════════════════════════════════════════ */
'use strict';

const { getAdmin } = require('./_lib/firebaseAdmin');
const { verifyToken, isAdmin } = require('./_lib/auth');
const { getClientIp, getGeo } = require('./_lib/ip');
const { mintToken } = require('./_lib/minter');

// Rarity tiers (keep in sync with frontend)
const RARITY = [
  { min: 90, label: '💎 Legendaria', color: '#f0d080', level: 4 },
  { min: 75, label: '🔮 Épica',      color: '#c080f0', level: 3 },
  { min: 55, label: '💙 Rara',       color: '#60a0f0', level: 2 },
  { min: 30, label: '🟢 Común',      color: '#4caf78', level: 1 },
  { min: 0,  label: '⚪ Básica',     color: '#888888', level: 0 },
];

const rint  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function randomHarvest() {
  const pct  = rint(0, 100);
  const tier = RARITY.find((r) => pct >= r.min) || RARITY[RARITY.length - 1];
  
  return {
    rarityLabel: tier.label,
    rarityColor: tier.color,
    rarityLevel: tier.level,        // ← New: numeric level for contract
    rarityPct:   pct,
    perfectDays: clamp(Math.round((pct / 100) * 7) + rint(-1, 1), 0, 7),
    health:      clamp(Math.round(45 + pct * 0.5) + rint(-8, 8), 10, 100),
    maxStreak:   clamp(Math.round((pct / 100) * 7) + rint(-1, 1), 0, 7),
    coinsEarned: clamp(Math.round((pct / 100) * 900) + rint(-40, 40), 0, 950),
  };
}

function sanitizeHarvest(x) {
  if (!x || typeof x !== 'object') return null;
  const lvl = clamp(Math.round(Number(x.rarityLevel)), 0, 4);
  const tier = RARITY.find((r) => r.level === lvl) || RARITY[RARITY.length - 1];
  return {
    rarityLabel: tier.label,
    rarityColor: tier.color,
    rarityLevel: lvl,
    rarityPct:   clamp(Math.round(Number(x.rarityPct) || 0), 0, 100),
    perfectDays: clamp(Math.round(Number(x.perfectDays) || 0), 0, 7),
    health:      clamp(Math.round(Number(x.health) || 0), 0, 100),
    maxStreak:   clamp(Math.round(Number(x.maxStreak) || 0), 0, 7),
    coinsEarned: clamp(Math.round(Number(x.coinsEarned) || 0), 0, 5000),
  };
}

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
  if (!(await isAdmin(decoded.uid))) {
    res.status(403).json({ error: 'Forbidden — admin only' });
    return;
  }

  const admin = getAdmin();
  const db = admin.firestore();

  async function audit(action, meta = {}) {
    try {
      await db.collection('audit_logs').add({
        uid:       decoded.uid,
        email:     decoded.email || null,
        action,
        ip:        getClientIp(req),
        geo:       getGeo(req),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
        meta,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) { /* swallow */ }
  }

  const chainKey = 'sepolia';

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const h = sanitizeHarvest(body.harvest) || randomHarvest();

  // Get sequential display ID
  const harvestsRef = db.collection('users').doc(decoded.uid).collection('harvests');
  let displayId = 1;
  try {
    const snap = await harvestsRef.get();
    displayId = snap.size + 1;
  } catch (e) { /* default to 1 */ }

  await audit('mint_request', { 
    admin: true, 
    rarity: h.rarityLabel, 
    rarityLevel: h.rarityLevel,
    chain: chainKey 
  });

  try {
    // === NEW CHEAP MINT ===
    const result = await mintToken(chainKey, {
      rarity: h.rarityLevel   // 0 to 4
    });

    // Save to Firestore
    await harvestsRef.add({
      tokenId:         displayId,
      ownerUid:        decoded.uid,
      ownerName:       decoded.email ? decoded.email.split('@')[0] : 'admin',
      harvestedAt:     admin.firestore.FieldValue.serverTimestamp(),
      stageIdx:        7,
      health:          h.health,
      perfectDays:     h.perfectDays,
      maxStreak:       h.maxStreak,
      coinsEarned:     h.coinsEarned,
      harvestBonus:    0,
      rarityLabel:     h.rarityLabel,
      rarityColor:     h.rarityColor,
      rarityPct:       h.rarityPct,
      rarityLevel:     h.rarityLevel,
      isPublic:        false,
      adminGenerated:  true,
      minted:          true,
      mintStatus:      'submitted',
      chain:           result.chain,
      tokenStandard:   result.tokenStandard,
      contractAddress: result.contract,
      onChainTokenId:  result.tokenId,
      mintedTo:        result.to,
      mintTxHash:      result.txHash,
      explorerUrl:     result.explorerUrl,
      mintedAt:        admin.firestore.FieldValue.serverTimestamp(),
      dayHistory:      [],
    });

    await audit('mint_success', {
      admin: true,
      rarity: h.rarityLabel,
      rarityLevel: h.rarityLevel,
      chain: chainKey,
      txHash: result.txHash,
      tokenId: result.tokenId,
    });

    res.status(200).json({ 
      ok: true, 
      harvest: { ...h, tokenId: displayId }, 
      mint: result 
    });

  } catch (e) {
    console.error('Admin mint error:', e);
    await audit('mint_failed', { 
      admin: true, 
      error: String(e && e.message).slice(0, 200) 
    });
    
    res.status(500).json({ 
      error: 'Admin mint failed', 
      detail: e && e.message 
    });
  }
};

module.exports.config = { maxDuration: 30 };
