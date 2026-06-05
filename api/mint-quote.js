/* ═══════════════════════════════════════════
   GET /api/mint-quote
   Woli Farm · live gas + cost estimate
   ═══════════════════════════════════════════
   Admin-only. Estimates the gas, gas price, total
   cost and the minter wallet's balance for a mint,
   so the UI can show it before confirming.
═══════════════════════════════════════════ */
'use strict';

const { ethers } = require('ethers');
const { verifyToken, isAdmin } = require('./_lib/auth');
const { getMintContext } = require('./_lib/provider');

const ABI = [
  'function safeMintTest(address to, uint8 rarity) returns (uint256)',
];

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const decoded = await verifyToken(req);
  if (!decoded) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!(await isAdmin(decoded.uid))) { res.status(403).json({ error: 'Forbidden — admin only' }); return; }

  const chainKey = (req.query && req.query.chain) || 'sepolia';

  const { getChain } = require('./_lib/chains');
  const _chain = getChain(chainKey);

  // ── Solana: no EVM gas model; return fixed cost + treasury balance ──
  if (_chain && _chain.family === 'solana') {
    try {
      const { quoteSolana } = require('./_lib/minter-solana');
      const q = await quoteSolana(chainKey);
      res.status(200).json({
        chain:            _chain.name,
        currency:         'SOL',
        estCostEth:       q.estCostSol.toString(),     // reuse UI field
        minterAddress:    q.minterAddress,
        minterBalanceEth: q.minterBalanceSol.toString(),
        enough:           q.enough,
        testnet:          true,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  let ctx;
  try {
    ctx = getMintContext(chainKey);
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }
  const { chain, provider, wallet, Contract } = ctx;

  try {
    const contract = new Contract(chain.contract, ABI, wallet);

    const [fee, balance] = await Promise.all([
      provider.getFeeData(),
      provider.getBalance(wallet.address),
    ]);

    let gasLimit;
    try {
      gasLimit = await contract.safeMintTest.estimateGas(wallet.address, 2);
    } catch (e) {
      gasLimit = 95000n; // safe fallback if estimate reverts
    }
    const gasBuffered = (gasLimit * 115n) / 100n;        // +15% headroom
    const gasPrice    = fee.maxFeePerGas || fee.gasPrice || 0n;
    const estCostWei  = gasBuffered * gasPrice;

    res.status(200).json({
      chain:            chain.name,
      currency:         chain.currency || 'ETH',
      gasLimit:         gasLimit.toString(),
      gasLimitBuffered: gasBuffered.toString(),
      gasPriceGwei:     Number(ethers.formatUnits(gasPrice, 'gwei')),
      estCostEth:       ethers.formatEther(estCostWei),
      minterAddress:    wallet.address,
      minterBalanceEth: ethers.formatEther(balance),
      enough:           balance >= estCostWei,
      testnet:          true,
    });
  } catch (e) {
    res.status(500).json({ error: 'Quote failed', detail: e.message });
  }
};
