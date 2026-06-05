/* ═══════════════════════════════════════════
   MINTER — chain-family dispatcher
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   EVM / zkSync → ethers|zksync-ethers + ERC-721
   Solana       → Umi + Metaplex Core (minter-solana)
═══════════════════════════════════════════ */
'use strict';

const { getChain } = require('./chains');
const { getMintContext } = require('./provider');

const ABI = [
  'function safeMintTest(address to, uint8 rarity) returns (uint256)',
  'function safeMint(address to, uint8 rarity, uint16 score, uint8 cycleDays) returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'event HarvestMinted(uint256 indexed tokenId, address to, uint8 rarity, uint16 score)'
];

async function mintEvm(chainKey, harvestData, toAddressOverride) {
  const { chain, wallet, Contract } = getMintContext(chainKey);
  const contract = new Contract(chain.contract, ABI, wallet);

  let predictedId = null;
  try {
    const minted = await contract.totalMinted();
    predictedId = (minted + 1n).toString();
  } catch (e) { /* non-fatal */ }

  const to = toAddressOverride || wallet.address;
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

// Unified entry point used by the mint endpoints.
async function mintToken(chainKey, harvestData, toAddressOverride) {
  const chain = getChain(chainKey);
  if (!chain) throw new Error('Unknown chain: ' + chainKey);

  if (chain.family === 'solana') {
    const { mintAsset } = require('./minter-solana');
    return mintAsset(chainKey, harvestData);
  }
  // 'evm' and 'zksync' share the same ERC-721 path (provider handles the diff)
  return mintEvm(chainKey, harvestData, toAddressOverride);
}

module.exports = { mintToken };
