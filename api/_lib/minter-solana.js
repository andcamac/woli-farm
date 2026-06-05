/* ═══════════════════════════════════════════
   MINTER (Solana) — Metaplex Core via Umi
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   Custodial mint: the Core Asset is created owned by
   the treasury keypair (SOLANA_MINTER_SECRET). No
   deployed contract is needed — the Core program is
   global. Metadata is served from our own Vercel app
   (see /api/nft-metadata) so the `uri` is a public
   HTTPS URL the indexers can fetch.
═══════════════════════════════════════════ */
'use strict';

const { getChain } = require('./chains');
const { buildMetadataQuery } = require('./metadata');

// Resolve the public base URL for metadata (Vercel injects VERCEL_URL).
function publicBaseUrl() {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return 'https://' + process.env.VERCEL_URL;
  return ''; // last resort; metadata URI would be relative (avoid)
}

// Accepts base58 secret key OR a JSON array (solana-keygen output).
function secretToBytes(secret) {
  const s = String(secret || '').trim();
  if (!s) throw new Error('SOLANA_MINTER_SECRET not set');
  if (s[0] === '[') {
    return Uint8Array.from(JSON.parse(s));
  }
  const { base58 } = require('@metaplex-foundation/umi/serializers');
  return base58.serialize(s);
}

async function mintAsset(chainKey, harvestData) {
  const chain = getChain(chainKey);
  if (!chain || chain.family !== 'solana') throw new Error('Not a Solana chain: ' + chainKey);
  if (!chain.rpcUrl) throw new Error('Mint not configured: missing SOLANA_RPC_URL');

  const { createUmi }              = require('@metaplex-foundation/umi-bundle-defaults');
  const { mplCore, create }        = require('@metaplex-foundation/mpl-core');
  const { generateSigner, keypairIdentity } = require('@metaplex-foundation/umi');
  const { base58 }                 = require('@metaplex-foundation/umi/serializers');

  const umi = createUmi(chain.rpcUrl).use(mplCore());
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretToBytes(process.env.SOLANA_MINTER_SECRET));
  umi.use(keypairIdentity(keypair));

  // Build the public metadata URI (served by our app).
  const base = publicBaseUrl();
  const uri  = base
    ? base + '/api/nft-metadata?' + buildMetadataQuery(harvestData)
    : 'https://woli-farm.vercel.app/api/nft-metadata?' + buildMetadataQuery(harvestData);

  const name  = 'Woli Harvest #' + String(harvestData.tokenId || 0).padStart(4, '0');
  const asset = generateSigner(umi);

  const res = await create(umi, { asset, name, uri }).sendAndConfirm(umi);
  const sig = base58.deserialize(res.signature)[0];

  const suffix = chain.explorerSuffix || '';
  return {
    txHash:        sig,
    tokenId:       asset.publicKey,                       // Core asset (mint) address
    to:            keypair.publicKey,                     // custodial treasury
    chain:         chainKey,
    contract:      '',                                    // n/a on Solana
    tokenStandard: chain.tokenStandard,                   // 'Metaplex Core'
    explorerUrl:   chain.explorerTx + sig + suffix,
    assetUrl:      chain.explorerToken + asset.publicKey + suffix,
    metadataUri:   uri,
  };
}

module.exports = { mintAsset, quoteSolana };

// Lightweight quote: treasury address, balance, and a safe fixed cost.
// Core single-account mint ≈ 0.0029 SOL rent + ~0.000005 SOL fee.
async function quoteSolana(chainKey) {
  const chain = getChain(chainKey);
  if (!chain || chain.family !== 'solana') throw new Error('Not a Solana chain: ' + chainKey);

  const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
  const { keypairIdentity } = require('@metaplex-foundation/umi');

  const umi = createUmi(chain.rpcUrl);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretToBytes(process.env.SOLANA_MINTER_SECRET));
  umi.use(keypairIdentity(keypair));

  let balanceSol = 0;
  try {
    const bal = await umi.rpc.getBalance(keypair.publicKey);
    balanceSol = Number(bal.basisPoints) / 1e9; // lamports → SOL
  } catch (e) { /* leave 0 */ }

  const estCostSol = 0.0035;
  return {
    minterAddress:    keypair.publicKey,
    minterBalanceSol: balanceSol,
    estCostSol,
    enough:           balanceSol >= estCostSol,
  };
}
