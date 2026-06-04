/* ═══════════════════════════════════════════
   GET /api/chains
   Woli Farm · admin-only chain registry status
   ═══════════════════════════════════════════
   Reports which chains are mint-ready (rpc + contract
   + minter key present) WITHOUT exposing any secret.
═══════════════════════════════════════════ */
'use strict';

const { verifyToken, isAdmin } = require('./_lib/auth');
const { getChains } = require('./_lib/chains');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const decoded = await verifyToken(req);
  if (!decoded) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!(await isAdmin(decoded.uid))) { res.status(403).json({ error: 'Forbidden — admin only' }); return; }

  const hasKey = !!process.env.MINTER_PRIVATE_KEY;
  const chains = Object.values(getChains()).map(c => ({
    key:        c.key,
    name:       c.name,
    currency:   c.currency || 'ETH',
    zksync:     !!c.zksync,
    configured: !!(c.rpcUrl && c.contract && hasKey),
  }));

  res.status(200).json({ chains });
};
