# 🔗 Session 3 — On-Chain Minting (Sepolia)

Turns the "Mint as NFT" button into a real mint of an ERC-721 on the
**Ethereum Sepolia testnet**. Custodial model: the server's minter wallet
pays gas and holds the token; ownership is tracked in the app. Metadata is
fully on-chain (data URI + SVG) — no IPFS, no hosting.

Everything here is **testnet** — no real money is involved.

---

## What got added / changed

**New**
```
contracts/WoliHarvest.sol   ERC-721 contract (OpenZeppelin v5)
api/_lib/chains.js          chain registry (RPC + contract from env)
api/_lib/metadata.js        on-chain metadata + SVG builder
api/mint.js                 POST /api/mint — submits the mint tx
```
**Modified**
```
package.json                + ethers ^6
collection.html             "Mint" button is now live (mint / minted / owner-only states)
```

No Firestore rules change (the server updates the harvest doc via Admin SDK).

---

## Step 1 — Create a testnet minter wallet
1. In a browser with MetaMask (or any wallet), create a **fresh wallet** used
   only for this. **Never use a wallet that holds real funds.**
2. Copy its **private key** (MetaMask → Account details → Show private key).
3. Switch the network to **Sepolia** and get free test ETH from a faucet
   (e.g. search "Sepolia faucet"). A small amount covers many mints.

## Step 2 — Get a Sepolia RPC URL
Create a free project at **Alchemy** or **Infura** and copy the **Sepolia
HTTPS RPC URL** (looks like `https://eth-sepolia.g.alchemy.com/v2/XXXX`).
A public RPC works too but is less reliable.

## Step 3 — Deploy the contract (Remix, ~3 min)
1. Open <https://remix.ethereum.org>.
2. New file → paste `contracts/WoliHarvest.sol`.
3. **Solidity Compiler** tab → compiler `0.8.20+` → **Compile**.
   (Remix fetches the OpenZeppelin imports automatically.)
4. **Deploy & Run** tab:
   - Environment: **Injected Provider - MetaMask**, with MetaMask on **Sepolia**
     and your **minter wallet** selected.
   - Contract: `WoliHarvest`.
   - Next to **Deploy**, set the constructor arg `initialOwner` = your
     **minter wallet address** (so the server can mint).
   - Click **Deploy** and confirm in MetaMask.
5. Copy the **deployed contract address**.

> The owner of the contract MUST equal the minter wallet whose private key the
> server uses — otherwise `safeMint` reverts (onlyOwner).

## Step 4 — Add env vars in Vercel
Vercel → project → **Settings → Environment Variables** (Production):

| Name | Value |
|------|-------|
| `MINTER_PRIVATE_KEY` | the minter wallet private key (Step 1) |
| `SEPOLIA_RPC_URL` | your Sepolia RPC URL (Step 2) |
| `WOLI_NFT_CONTRACT_SEPOLIA` | the deployed contract address (Step 3) |

(Keep `FIREBASE_SERVICE_ACCOUNT` from Session 1.) **Redeploy** after saving.

## Step 5 — Upload the code
Push the new/modified files, then let Vercel build (it installs `ethers` from
`package.json`).

---

## Verify
1. Earn at least one harvest, open `collection.html` → **🔒 Mi Colección**.
2. A harvest card now shows an active **🔗 Mint as NFT** button.
3. Click it → "Minteando…" → toast "¡Minteado! Tx enviada a Sepolia."
4. The button becomes **✓ Minteado** linking to **sepolia.etherscan.io** —
   open it; within ~15s the tx confirms and the token appears.
5. The admin dashboard's **NFTs Minteados** card increments, and the audit
   feed shows `mint_request` / `mint_success` with your IP.

---

## How it works (and why it won't time out)
The endpoint **submits** the transaction and records `mintTxHash` immediately —
it does not block waiting for confirmation, so it stays well under the
serverless time limit. The tx mines a few seconds later. The on-chain token id
is predicted from `totalMinted() + 1` (exact for sequential demo traffic).

## Notes
- **Custodial by design:** tokens mint to the treasury (minter) wallet; the app
  records ownership. True per-user wallets come in **Session 4 (Abstract Global
  Wallet)** — that's the natural place for user-owned, on-chain NFTs.
- **Multi-chain ready:** `api/_lib/chains.js` has a commented Abstract entry.
  Adding it = uncomment + set `ABSTRACT_RPC_URL` and `WOLI_NFT_CONTRACT_ABSTRACT`.
  The mint endpoint already accepts a `chain` parameter.
- **Double-mint guard:** a harvest already marked `minted` returns its existing
  tx instead of minting again.
- If a mint fails, the audit log records `mint_failed` with the reason, and the
  button resets so it can be retried.

## Next session
**Session 4 — Add Abstract as a second chain** (EVM, ~95% code reuse) with
Abstract Global Wallet so users get real per-user on-chain ownership via the
same email login they already use.
