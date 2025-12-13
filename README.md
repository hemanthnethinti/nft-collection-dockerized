# NFT Collection Smart Contract

## Overview
This project implements a basic but production-oriented ERC-721 NFT smart contract. The goal is to demonstrate correct use of standards, clean contract architecture, security best practices, testing, and Docker-based reproducibility. The contract is designed to be simple, auditable, and scalable for future extensions.

## Smart Contract Design
The contract is built on top of OpenZeppelin’s ERC-721 implementation. Core responsibilities are clearly separated:
- **State**: token supply, base URI, and ownership are stored minimally.
- **Functions**: minting, transfers, and metadata access follow ERC-721 standards.
- **Access Control**: admin-only operations are restricted using `Ownable`.
This structure keeps the code maintainable and reduces the risk of bugs.

## ERC-721 Features
Implemented:
- ERC-721 core functionality
- Metadata extension (`tokenURI`)
- Safe minting
- Ownership checks

Omitted:
- `ERC721Enumerable` to avoid high gas costs on large collections  
The trade-off prioritizes scalability and gas efficiency over on-chain enumeration.

## Metadata Strategy
The contract uses a **base URI + tokenId** pattern for metadata resolution. Metadata is stored off-chain (e.g., IPFS), which minimizes on-chain storage and allows the collection to scale to tens of thousands of tokens. Updating the base URI does not require per-token changes.

## Testing
Testing is done using **Hardhat**. The test suite covers:
- Successful minting and transfers
- Unauthorized access attempts
- Invalid token queries
- Edge cases such as zero addresses  
Both success paths and failure scenarios are validated to ensure robustness.

## Security Considerations
Key risks addressed:
- Unauthorized minting → protected by `onlyOwner`
- Incorrect ownership changes → enforced by ERC-721 logic
- Re-entrancy → no external calls during state changes  
Using audited OpenZeppelin libraries significantly reduces attack surface.

## Docker Setup
The project is containerized using Docker with:
- Official Node.js LTS base image
- Dependency installation separated for build caching
- Locked dependency versions for reproducibility  
This ensures consistent builds across environments.

## Scalability & Future Improvements
For higher usage:
- Add batch minting to reduce gas costs
- Use off-chain indexing tools for querying
- Introduce role-based access control
- Consider upgradeable contracts for long-term evolution

## Tech Stack
- Solidity ^0.8.x
- OpenZeppelin Contracts
- Hardhat
- Docker
- Node.js
