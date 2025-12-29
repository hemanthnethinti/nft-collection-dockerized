<<<<<<< HEAD
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
=======
# NFT Collection – ERC-721 Smart Contract (Dockerized + Tested)

This project implements a secure, ERC-721–compatible NFT collection smart contract with a **maximum supply limit**, **admin-only minting**, and **metadata support**. The project is fully containerized so the complete test suite runs automatically inside Docker without any manual setup.

The contract is written in Solidity and uses **Hardhat + OpenZeppelin** for security-focused token logic.

---

## 🚀 Features

- ERC-721–compatible NFT contract
- Admin-only minting (owner controlled)
- Enforced **maximum supply**
- Prevention of double-minting
- Token metadata via **base URI**
- Safety checks:
  - zero-address mint prevention
  - duplicate token prevention
  - max supply limit enforcement
- Automated Hardhat test suite
- Fully self-contained Docker execution

---

## 🏗 Project Structure

```
project-root/
│
├── contracts/
│   └── NftCollection.sol
│
├── test/
│   └── NftCollection.test.js
│
├── hardhat.config.js
├── package.json
├── Dockerfile
└── README.md
```

---

## ⚙️ Technology Stack

- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts
- Node.js
- Docker

---

## 🔐 Contract Summary

**Contract Name:** `NftCollection`

Core behavior:

- Only the contract owner may mint new NFTs
- Each token ID can only be minted once
- Total supply may never exceed the configured `maxSupply`
- Metadata is provided through a base URI

The required ERC-721 events (`Transfer`, `Approval`, `ApprovalForAll`) are emitted automatically through OpenZeppelin.

---

## 🧪 Running Tests Locally

Install dependencies:

```
npm install
```

Compile contracts:

```
npx hardhat compile
```

Run tests:

```
npx hardhat test
```

Expected output should show all tests **passing**.

---

## 🐳 Running Inside Docker (Evaluation Mode)

### Build the Docker image

```
docker build -t nft-contract .
```

### Run the container

```
docker run nft-contract
```

The container will:

1. Install dependencies
2. Compile the contract
3. Run the full test suite

Expected output:

```
6 passing
0 failing
```

No manual steps or external dependencies are required.

---

## 📌 Test Coverage Overview

The automated test suite validates:

### ✔ Core Behavior
- deployment configuration
- owner-only minting
- successful minting
- correct ownership and balances

### ✔ Security & Reliability
- prevents double minting
- enforces maximum supply
- prevents mint to zero address
- invalid actions revert

---
>>>>>>> dfe9181 (Add ERC721 contract, tests, Docker setup and README update)
