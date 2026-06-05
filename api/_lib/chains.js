/* ═══════════════════════════════════════════
   CHAINS — multi-chain registry
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   Each chain declares a `family` so the mint layer
   knows which implementation to use:
     - 'evm'    → ethers + ERC-721 contract
     - 'zksync' → zksync-ethers + ERC-721 contract
     - 'solana' → Umi + Metaplex Core (no deployed
                  contract; the Core program is global)
   RPCs / contracts / secrets come from env vars.
═══════════════════════════════════════════ */
'use strict';

function getChains() {
  return {
    sepolia: {
      key:           'sepolia',
      name:          'Ethereum Sepolia',
      family:        'evm',
      chainId:       11155111,
      tokenStandard: 'ERC-721',
      currency:      'SepoliaETH',
      rpcUrl:        process.env.SEPOLIA_RPC_URL || '',
      contract:      process.env.WOLI_NFT_CONTRACT_SEPOLIA || '',
      explorerTx:    'https://sepolia.etherscan.io/tx/',
      explorerToken: 'https://sepolia.etherscan.io/token/',
    },

    // ── Abstract (ZK Stack / zkSync Era — needs zksync-ethers) ──
    abstract: {
      key:           'abstract',
      name:          'Abstract Testnet',
      family:        'zksync',
      zksync:        true,
      chainId:       11124,
      tokenStandard: 'ERC-721',
      currency:      'ETH',
      rpcUrl:        process.env.ABSTRACT_RPC_URL || 'https://api.testnet.abs.xyz',
      contract:      process.env.WOLI_NFT_CONTRACT_ABSTRACT || '',
      explorerTx:    'https://sepolia.abscan.org/tx/',
      explorerToken: 'https://sepolia.abscan.org/token/',
    },

    // ── Solana (Metaplex Core · devnet) ──
    // Note: Metaplex Core lives on devnet/mainnet, NOT the
    // "testnet" validator cluster — devnet IS the test network.
    solana: {
      key:           'solana',
      name:          'Solana Devnet',
      family:        'solana',
      cluster:       'devnet',
      tokenStandard: 'Metaplex Core',
      currency:      'SOL',
      rpcUrl:        process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      // No deployed contract: the Core program is global.
      contract:      '',
      explorerTx:    'https://solscan.io/tx/',
      explorerToken: 'https://solscan.io/token/',
      explorerSuffix:'?cluster=devnet',
    },
  };
}

function getChain(key) {
  return getChains()[key] || null;
}

module.exports = { getChains, getChain };
