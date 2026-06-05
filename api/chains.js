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

  const hasEvmKey    = !!process.env.MINTER_PRIVATE_KEY;
  const hasSolSecret = !!process.env.SOLANA_MINTER_SECRET;

  function isConfigured(c) {
    if (c.family === 'solana') return !!(c.rpcUrl && hasSolSecret);
    return !!(c.rpcUrl && c.contract && hasEvmKey); // evm / zksync
  }

  const chains = Object.values(getChains()).map(c => ({
    key:        c.key,
    name:       c.name,
    family:     c.family,
    currency:   c.currency || 'ETH',
    zksync:     !!c.zksync,
    configured: isConfigured(c),
  }));

  res.status(200).json({ chains });
};
