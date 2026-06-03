/* ═══════════════════════════════════════════
   MINTER — Updated for optimized contract
   Woli Farm · serverless layer
═══════════════════════════════════════════ */
'use strict';

const { ethers } = require('ethers');
const { getChain } = require('./chains');

const ABI = [
  'function safeMintTest(address to, uint8 rarity) returns (uint256)',
  'function safeMint(address to, uint8 rarity, uint16 score, uint8 cycleDays) returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'event HarvestMinted(uint256 indexed tokenId, address to, uint8 rarity, uint16 score)'
];

async function mintToken(chainKey, harvestData, toAddressOverride) {
  const chain = getChain(chainKey);
  if (!chain) throw new Error('Unknown chain: ' + chainKey);

  if (!chain.rpcUrl || !chain.contract || !process.env.MINTER_PRIVATE_KEY) {
    throw new Error('Mint not configured for ' + chainKey);
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
  
  // Use the cheap safeMintTest
  const tx = await contract.safeMintTest(to, harvestData.rarity || 2);

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
