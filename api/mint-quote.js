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
const { getChain } = require('./_lib/chains');

const ABI = [
  'function safeMintTest(address to, uint8 rarity) returns (uint256)',
];

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const decoded = await verifyToken(req);
  if (!decoded) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!(await isAdmin(decoded.uid))) { res.status(403).json({ error: 'Forbidden — admin only' }); return; }

  const chainKey = (req.query && req.query.chain) || 'sepolia';
  const chain = getChain(chainKey);
  if (!chain || !chain.rpcUrl || !chain.contract || !process.env.MINTER_PRIVATE_KEY) {
    res.status(500).json({ error: 'Mint not configured for ' + chainKey });
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const wallet   = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(chain.contract, ABI, wallet);

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
