// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NftCollection is ERC721, Ownable {
    uint256 public maxSupply;
    uint256 public totalSupply;
    string private baseURI;

    mapping(uint256 => bool) private minted;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory baseURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        maxSupply = maxSupply_;
        baseURI = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function safeMint(address to, uint256 tokenId) external onlyOwner {
        require(to != address(0), "Zero address");
        require(!minted[tokenId], "Already minted");
        require(totalSupply < maxSupply, "Max supply reached");

        minted[tokenId] = true;
        totalSupply++;

        _safeMint(to, tokenId);
    }
}
