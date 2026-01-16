// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/**
 * @title NftCollection
 * @dev A complete ERC721 NFT collection contract with minting, burning, and metadata support
 * Features: owner-controlled minting, max supply enforcement, token burning, and full ERC721 compliance
 */
contract NftCollection is ERC721, ERC721Burnable, Ownable {
    // State variables
    uint256 public maxSupply;
    uint256 public totalSupply;
    string private baseURI;

    // Mapping to track minted token IDs
    mapping(uint256 => bool) private _tokenExists;

    // Events
    event BaseURIUpdated(string newBaseURI);
    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event TokenBurned(uint256 indexed tokenId);

    /**
     * @dev Constructor initializes the NFT collection
     * @param name_ The name of the collection
     * @param symbol_ The symbol of the collection
     * @param maxSupply_ The maximum number of tokens that can be minted
     * @param baseURI_ The base URI for token metadata
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory baseURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        require(maxSupply_ > 0, "Max supply must be greater than 0");
        require(bytes(baseURI_).length > 0, "Base URI cannot be empty");
        
        maxSupply = maxSupply_;
        baseURI = baseURI_;
        totalSupply = 0;
    }

    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Updates the base URI - only owner can call
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        require(bytes(newBaseURI).length > 0, "Base URI cannot be empty");
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Mints a new token - only owner can call
     * @param to The address to receive the token
     * @param tokenId The ID of the token to mint
     */
    function safeMint(address to, uint256 tokenId) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(!_tokenExists[tokenId], "Token already minted");
        require(totalSupply < maxSupply, "Max supply reached");
        require(tokenId > 0, "Token ID must be greater than 0");

        _tokenExists[tokenId] = true;
        totalSupply++;

        _safeMint(to, tokenId);
        emit TokenMinted(to, tokenId);
    }

    /**
     * @dev Mints multiple tokens - only owner can call
     * @param to The address to receive the tokens
     * @param tokenIds Array of token IDs to mint
     */
    function batchMint(address to, uint256[] calldata tokenIds) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenIds.length > 0, "Must mint at least one token");
        require(totalSupply + tokenIds.length <= maxSupply, "Batch mint exceeds max supply");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(!_tokenExists[tokenId], "Token already minted");
            require(tokenId > 0, "Token ID must be greater than 0");

            _tokenExists[tokenId] = true;
            totalSupply++;

            _safeMint(to, tokenId);
            emit TokenMinted(to, tokenId);
        }
    }

    /**
     * @dev Checks if a token exists
     * @param tokenId The ID of the token
     * @return True if the token exists, false otherwise
     */
    function tokenExists(uint256 tokenId) public view returns (bool) {
        return _tokenExists[tokenId];
    }

    /**
     * @dev Burns a token - token owner or contract owner can call
     * @param tokenId The ID of the token to burn
     */
    function burn(uint256 tokenId) public override {
        address tokenOwner = _ownerOf(tokenId);
        require(tokenOwner == msg.sender || msg.sender == owner(), "Not authorized to burn");
        
        _tokenExists[tokenId] = false;
        totalSupply--;

        // Directly call _burn without requiring approval
        _burn(tokenId);
        emit TokenBurned(tokenId);
    }

    /**
     * @dev Transfers a token with proper validation
     */
    function transferFrom(address from, address to, uint256 tokenId) 
        public 
        override
    {
        require(to != address(0), "Cannot transfer to zero address");
        require(_ownerOf(tokenId) == from, "Transfer from incorrect owner");
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Approves an address to transfer a token
     */
    function approve(address to, uint256 tokenId) 
        public 
        override
    {
        address tokenOwner = _ownerOf(tokenId);
        require(
            tokenOwner == msg.sender || 
            isApprovedForAll(tokenOwner, msg.sender) || 
            msg.sender == owner(), 
            "Not authorized to approve"
        );
        super.approve(to, tokenId);
    }

    /**
     * @dev Approves an operator for all tokens
     */
    function setApprovalForAll(address operator, bool approved) 
        public 
        override
    {
        require(operator != msg.sender, "Cannot approve yourself");
        super.setApprovalForAll(operator, approved);
    }

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for a token
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(_tokenExists[tokenId], "Token does not exist");
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Get remaining tokens that can be minted
     */
    function remainingSupply() public view returns (uint256) {
        return maxSupply - totalSupply;
    }

    /**
     * @dev Check if token ID is valid
     */
    function isValidTokenId(uint256 tokenId) public pure returns (bool) {
        return tokenId > 0;
    }

    // Support for ERC721Burnable functions
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
