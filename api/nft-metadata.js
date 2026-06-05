/* ═══════════════════════════════════════════
   GET /api/nft-metadata
   Woli Farm · public NFT metadata (JSON)
   ═══════════════════════════════════════════
   Public + cacheable. Solana Core assets store their
   `uri` pointing here; wallets/indexers fetch this
   JSON. Stateless: all fields come from query params
   (see buildMetadataQuery), so no DB lookup is needed.
═══════════════════════════════════════════ */
'use strict';

const { buildMetadata, harvestFromQuery } = require('./_lib/metadata');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const meta = buildMetadata(harvestFromQuery(req.query || {}));

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(JSON.stringify(meta));
};
