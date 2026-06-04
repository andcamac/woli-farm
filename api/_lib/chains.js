/* ═══════════════════════════════════════════
   CHAINS — multi-chain registry
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   Each chain's RPC URL and deployed contract come
   from env vars so secrets/addresses are never
   committed. To add Abstract (Session 4) just add
   another entry + its env vars — the mint endpoint
   is already chain-agnostic.
═══════════════════════════════════════════ */
'use strict';
 
function getChains() {
  return {
    sepolia: {
      key:           'sepolia',
      name:          'Ethereum Sepolia',
      chainId:       11155111,
      tokenStandard: 'ERC-721',
      currency:      'SepoliaETH',
      rpcUrl:        process.env.SEPOLIA_RPC_URL || '',
      contract:      process.env.WOLI_NFT_CONTRACT_SEPOLIA || '',
      explorerTx:    'https://sepolia.etherscan.io/tx/',
      explorerToken: 'https://sepolia.etherscan.io/token/',
    },
 
    // ── Session 4: Abstract (ZK Stack / zkSync Era — needs zksync-ethers) ──
    abstract: {
      key:           'abstract',
      name:          'Abstract Testnet',
      chainId:       11124,
      tokenStandard: 'ERC-721',
      currency:      'ETH',
      zksync:        true,
      rpcUrl:        process.env.ABSTRACT_RPC_URL || 'https://api.testnet.abs.xyz',
      contract:      process.env.WOLI_NFT_CONTRACT_ABSTRACT || '',
      explorerTx:    'https://sepolia.abscan.org/tx/',
      explorerToken: 'https://sepolia.abscan.org/token/',
    },
  };
}
 
function getChain(key) {
  return getChains()[key] || null;
}
 
module.exports = { getChains, getChain };
