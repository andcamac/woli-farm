/* ═══════════════════════════════════════════
   PROVIDER — chain-aware signer factory
   Woli Farm · serverless layer
   ═══════════════════════════════════════════
   Sepolia (and any standard EVM) uses plain ethers.
   Abstract is a ZK Stack / zkSync Era chain: sending a
   tx requires EIP-712 (type 113) signing, which plain
   ethers cannot do — so we use zksync-ethers there.
   zksync-ethers v6 is built on ethers v6, so the
   Contract API is identical downstream.
═══════════════════════════════════════════ */
'use strict';

const { ethers } = require('ethers');
const { getChain } = require('./chains');

// Returns { chain, provider, wallet, Contract, isZk }
function getMintContext(chainKey) {
  const chain = getChain(chainKey);
  if (!chain) throw new Error('Unknown chain: ' + chainKey);
  if (!chain.rpcUrl || !chain.contract || !process.env.MINTER_PRIVATE_KEY) {
    throw new Error('Mint not configured for ' + chainKey);
  }

  if (chain.zksync) {
    let zk;
    try {
      zk = require('zksync-ethers');
    } catch (e) {
      throw new Error('zksync-ethers not installed — run: npm i zksync-ethers');
    }
    const provider = new zk.Provider(chain.rpcUrl);
    const wallet   = new zk.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
    return { chain, provider, wallet, Contract: zk.Contract, isZk: true };
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet   = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
  return { chain, provider, wallet, Contract: ethers.Contract, isZk: false };
}

module.exports = { getMintContext };
