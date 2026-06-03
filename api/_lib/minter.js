/* ═══════════════════════════════════════════
   MINTER — shared on-chain mint helper
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   Submits a safeMint tx (does not wait for
   confirmation) and returns the tx + predicted
   token id. Used by the admin random-mint endpoint.
═══════════════════════════════════════════ */
'use strict';

const { ethers } = require('ethers');
const { getChain } = require('./chains');

const ABI = [
  'function safeMint(address to, string uri) returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

async function mintToken(chainKey, tokenUri, toAddressOverride) {
  const chain = getChain(chainKey);
  if (!chain) throw new Error('Unknown chain: ' + chainKey);
  if (!chain.rpcUrl || !chain.contract || !process.env.MINTER_PRIVATE_KEY) {
    throw new Error('Mint not configured for ' + chainKey +
      ' (missing RPC URL, contract address, or MINTER_PRIVATE_KEY)');
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet   = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(chain.contract, ABI, wallet);

  let predictedId = null;
  try {
    const minted = await contract.totalMinted();
    predictedId = (minted + 1n).toString();
  } catch (e) { /* non-fatal */ }

  const to = toAddressOverride || wallet.address;
  const tx = await contract.safeMint(to, tokenUri); // resolves on broadcast

  return {
    txHash:        tx.hash,
    tokenId:       predictedId,
    to,
    chain:         chainKey,
    contract:      chain.contract,
    tokenStandard: chain.tokenStandard,
    explorerUrl:   chain.explorerTx + tx.hash,
  };
}

module.exports = { mintToken };
