// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ═══════════════════════════════════════════
//  Woli Harvest — ERC-721
//  Each token is one completed 7-day grow cycle.
//  Metadata is passed in fully on-chain (data URI),
//  so no IPFS / external hosting is required.
//
//  Deploy with OpenZeppelin Contracts v5.x.
//  Only the owner (the server "minter" wallet) can mint.
// ═══════════════════════════════════════════

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WoliHarvest is ERC721URIStorage, Ownable {
    uint256 private _nextId = 1;

    constructor(address initialOwner)
        ERC721("Woli Harvest", "WOLIH")
        Ownable(initialOwner)
    {}

    /// @notice Mint a harvest NFT. Owner-only (the server minter wallet).
    /// @param to  recipient address
    /// @param uri full token metadata (e.g. a data:application/json;base64 URI)
    /// @return tokenId the newly minted on-chain token id
    function safeMint(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    /// @notice How many tokens have been minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextId - 1;
    }
}
