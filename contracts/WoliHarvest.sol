// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title WoliHarvest Optimized
 * @notice Much cheaper minting for testing + production-ready structure
 */
contract WoliHarvest is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextId = 1;

    // Core harvest data stored on-chain (very cheap)
    struct Harvest {
        uint8 rarity;        // 0-4 (Basic → Legendary)
        uint16 score;        // Performance score (0-1000)
        uint32 harvestDate;  // Timestamp
        uint8 cycleDays;     // Usually 7
    }

    mapping(uint256 => Harvest) public harvests;

    // Base URI for off-chain metadata (recommended for production)
    string private _baseTokenURI;

    event HarvestMinted(uint256 indexed tokenId, address to, uint8 rarity, uint16 score);

    constructor(address initialOwner, string memory baseURI)
        ERC721("Woli Harvest", "WOLIH")
        Ownable(initialOwner)
    {
        _baseTokenURI = baseURI;
    }

    /**
     * @notice Cheap mint for testing and normal use
     * @dev Only stores minimal data on-chain → ~40k-65k gas
     */
    function safeMint(
        address to,
        uint8 rarity,
        uint16 score,
        uint8 cycleDays
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextId++;

        _safeMint(to, tokenId);

        harvests[tokenId] = Harvest({
            rarity: rarity,
            score: score,
            harvestDate: uint32(block.timestamp),
            cycleDays: cycleDays
        });

        emit HarvestMinted(tokenId, to, rarity, score);
        return tokenId;
    }

    /**
     * @notice Test function - ultra cheap mint with fixed metadata
     * @dev Perfect for Sepolia testing (should be under 50k gas)
     */
    function safeMintTest(address to, uint8 rarity) public onlyOwner returns (uint256) {
        return safeMint(to, rarity, 850, 7); // Default good harvest
    }

    /**
     * @notice Token URI that builds JSON on-the-fly (cheaper than storing huge strings)
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        
        Harvest memory h = harvests[tokenId];
        string memory rarityName = _getRarityName(h.rarity);

        // You can expand this JSON as needed
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(
                abi.encodePacked(
                    '{"name":"Woli Harvest #', tokenId.toString(),
                    '","description":"7-day Hemp Grow Cycle","rarity":"', rarityName,
                    '","score":', Strings.toString(h.score),
                    ',"cycleDays":', Strings.toString(h.cycleDays),
                    ',"harvestDate":', Strings.toString(h.harvestDate),
                    ',"image":"data:image/svg+xml;base64,..."}' // Add short SVG here
                )
            )
        ));
    }

    function _getRarityName(uint8 rarity) internal pure returns (string memory) {
        if (rarity == 0) return "Basic";
        if (rarity == 1) return "Common";
        if (rarity == 2) return "Rare";
        if (rarity == 3) return "Epic";
        return "Legendary";
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function totalMinted() external view returns (uint256) {
        return _nextId - 1;
    }
}

/** Simple Base64 helper (add this at the bottom of the file) */
library Base64 {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        bytes memory result = new bytes(encodedLen);

        uint256 i;
        uint256 j;

        for (i = 0; i < data.length; i += 3) {
            uint256 a = uint8(data[i]);
            uint256 b = i + 1 < data.length ? uint8(data[i + 1]) : 0;
            uint256 c = i + 2 < data.length ? uint8(data[i + 2]) : 0;

            result[j++] = TABLE[a >> 2];
            result[j++] = TABLE[(a & 0x03) << 4 | b >> 4];
            result[j++] = TABLE[(b & 0x0f) << 2 | c >> 6];
            result[j++] = TABLE[c & 0x3f];
        }

        if (data.length % 3 == 1) {
            result[result.length - 1] = "=";
            result[result.length - 2] = "=";
        } else if (data.length % 3 == 2) {
            result[result.length - 1] = "=";
        }

        return string(result);
    }
}
