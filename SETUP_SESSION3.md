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
