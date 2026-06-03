/* ═══════════════════════════════════════════
   POST /api/mint
   Woli Farm · on-chain minting
   ═══════════════════════════════════════════
   Mints a harvest as an ERC-721 on the chosen chain
   (default: sepolia), using the server "minter" wallet.
   Custodial: the token is minted to the minter/treasury
   wallet; ownership is tracked in Firestore. Real
   per-user wallets arrive with Abstract (Session 4).

   The endpoint SUBMITS the tx and records it immediately
   (it does not block waiting for confirmation), so it
   never exceeds the serverless timeout. The tx confirms
   on-chain a few seconds later.

   Body:   { harvestId: string, chain?: string }
   Header: Authorization: Bearer <firebase id token>
═══════════════════════════════════════════ */
'use strict';

const { ethers } = require('ethers');
const { getAdmin } = require('./_lib/firebaseAdmin');
const { verifyToken } = require('./_lib/auth');
const { getClientIp, getGeo } = require('./_lib/ip');
const { getChain } = require('./_lib/chains');
const { buildTokenUri } = require('./_lib/metadata');

const ABI = [
  'function safeMint(address to, string uri) returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

// Best-effort audit write (never throws into the caller).
async function audit(admin, req, decoded, action, meta) {
  try {
    await admin.firestore().collection('audit_logs').add({
      uid:       decoded.uid,
      email:     decoded.email || null,
      action,
      ip:        getClientIp(req),
      geo:       getGeo(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
      meta:      meta || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) { /* swallow */ }
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

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const harvestId = String(body.harvestId || '');
  const chainKey  = String(body.chain || 'sepolia');
  if (!harvestId) {
    res.status(400).json({ error: 'harvestId required' });
    return;
  }

  const chain = getChain(chainKey);
  if (!chain) {
    res.status(400).json({ error: 'Unknown chain: ' + chainKey });
    return;
  }
  if (!chain.rpcUrl || !chain.contract || !process.env.MINTER_PRIVATE_KEY) {
    res.status(500).json({
      error: 'Mint not configured',
      detail: 'Missing one of: ' + chainKey.toUpperCase() +
        ' RPC URL, contract address, or MINTER_PRIVATE_KEY env vars.',
    });
    return;
  }

  const admin = getAdmin();
  const db = admin.firestore();
  const ref = db.collection('users').doc(decoded.uid).collection('harvests').doc(harvestId);

  // ── Load + guard the harvest ──
  let harvest;
  try {
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: 'Harvest not found' });
      return;
    }
    harvest = snap.data();
  } catch (e) {
    res.status(500).json({ error: 'Read failed', detail: e.message });
    return;
  }

  if (harvest.minted === true) {
    res.status(200).json({
      ok: true, already: true,
      txHash: harvest.mintTxHash || null,
      tokenId: harvest.onChainTokenId || null,
      chain: harvest.chain || chainKey,
      explorerUrl: harvest.explorerUrl || null,
    });
    return;
  }

  await audit(admin, req, decoded, 'mint_request', { harvestId, chain: chainKey });

  // ── Submit the mint tx (do NOT wait for confirmation) ──
  try {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const wallet   = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(chain.contract, ABI, wallet);

    // Predict the token id (nextId == totalMinted + 1). Fine for sequential
    // demo traffic; the real id is fixed once the tx is mined.
    let predictedId = null;
    try {
      const minted = await contract.totalMinted();
      predictedId = (minted + 1n).toString();
    } catch (e) { /* non-fatal */ }

    const tokenUri = buildTokenUri({ ...harvest, id: harvestId });
    const to = wallet.address; // custodial treasury

    const tx = await contract.safeMint(to, tokenUri); // resolves on broadcast
    const txHash = tx.hash;
    const explorerUrl = chain.explorerTx + txHash;

    // ── Record on the harvest doc ──
    await ref.set({
      minted:          true,
      mintStatus:      'submitted', // confirms on-chain shortly after
      chain:           chainKey,
      tokenStandard:   chain.tokenStandard,
      contractAddress: chain.contract,
      onChainTokenId:  predictedId,
      mintedTo:        to,
      mintTxHash:      txHash,
      explorerUrl,
      mintedAt:        admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await audit(admin, req, decoded, 'mint_success', {
      harvestId, chain: chainKey, txHash, tokenId: predictedId,
    });

    res.status(200).json({
      ok: true,
      txHash,
      tokenId: predictedId,
      chain: chainKey,
      contract: chain.contract,
      explorerUrl,
    });
  } catch (e) {
    await audit(admin, req, decoded, 'mint_failed', {
      harvestId, chain: chainKey, error: String(e && e.message).slice(0, 180),
    });
    res.status(500).json({ error: 'Mint failed', detail: e && e.message });
  }
};

// Allow a little extra runtime headroom where the platform honors it.
module.exports.config = { maxDuration: 30 };
