const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftCollection", function () {
  async function deployFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const NftCollection = await ethers.getContractFactory("NftCollection");
    const contract = await NftCollection.deploy(
      "MyNFT",
      "MNFT",
      10,
      "https://metadata.example.com/"
    );

    return { contract, owner, user1, user2, user3 };
  }

  // ==================== DEPLOYMENT TESTS ====================
  describe("Deployment", function () {
    it("deploys with correct config", async function () {
      const { contract } = await deployFixture();

      expect(await contract.name()).to.equal("MyNFT");
      expect(await contract.symbol()).to.equal("MNFT");
      expect(await contract.maxSupply()).to.equal(10);
      expect(await contract.totalSupply()).to.equal(0);
    });

    it("initializes base URI correctly", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.safeMint(user1.address, 1);
      const tokenURI = await contract.tokenURI(1);
      expect(tokenURI).to.contain("https://metadata.example.com/");
    });

    it("sets owner correctly", async function () {
      const { contract, owner } = await deployFixture();
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("reverts if max supply is zero", async function () {
      const NftCollection = await ethers.getContractFactory("NftCollection");
      await expect(
        NftCollection.deploy("MyNFT", "MNFT", 0, "https://metadata.example.com/")
      ).to.be.revertedWith("Max supply must be greater than 0");
    });

    it("reverts if base URI is empty", async function () {
      const NftCollection = await ethers.getContractFactory("NftCollection");
      await expect(
        NftCollection.deploy("MyNFT", "MNFT", 10, "")
      ).to.be.revertedWith("Base URI cannot be empty");
    });
  });

  // ==================== MINTING TESTS ====================
  describe("Minting", function () {
    it("mints successfully by owner", async function () {
      const { contract, owner, user1 } = await deployFixture();

      await expect(contract.safeMint(user1.address, 1))
        .to.emit(contract, "TokenMinted")
        .withArgs(user1.address, 1);

      expect(await contract.totalSupply()).to.equal(1);
      expect(await contract.ownerOf(1)).to.equal(user1.address);
      expect(await contract.balanceOf(user1.address)).to.equal(1);
    });

    it("only owner can mint", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await expect(
        contract.connect(user1).safeMint(user2.address, 1)
      ).to.be.reverted;
    });

    it("mints and updates balances correctly", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      expect(await contract.balanceOf(user1.address)).to.equal(1);

      await contract.safeMint(user2.address, 2);
      expect(await contract.balanceOf(user2.address)).to.equal(1);
      expect(await contract.totalSupply()).to.equal(2);
    });

    it("prevents double minting of same token ID", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.safeMint(user2.address, 1)
      ).to.be.revertedWith("Token already minted");
    });

    it("enforces max supply", async function () {
      const { contract, owner, user1 } = await deployFixture();

      for (let i = 1; i <= 10; i++) {
        await contract.safeMint(user1.address, i);
      }

      expect(await contract.totalSupply()).to.equal(10);

      await expect(
        contract.safeMint(user1.address, 11)
      ).to.be.revertedWith("Max supply reached");
    });

    it("prevents mint to zero address", async function () {
      const { contract } = await deployFixture();

      await expect(
        contract.safeMint(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("prevents minting token ID 0", async function () {
      const { contract, user1 } = await deployFixture();

      await expect(
        contract.safeMint(user1.address, 0)
      ).to.be.revertedWith("Token ID must be greater than 0");
    });

    it("batch mints multiple tokens", async function () {
      const { contract, user1 } = await deployFixture();

      const tokenIds = [1, 2, 3, 4, 5];
      await contract.batchMint(user1.address, tokenIds);

      expect(await contract.totalSupply()).to.equal(5);
      expect(await contract.balanceOf(user1.address)).to.equal(5);

      for (const tokenId of tokenIds) {
        expect(await contract.ownerOf(tokenId)).to.equal(user1.address);
      }
    });

    it("prevents batch mint exceeding max supply", async function () {
      const { contract, user1 } = await deployFixture();

      const tokenIds = Array.from({ length: 15 }, (_, i) => i + 1);
      await expect(
        contract.batchMint(user1.address, tokenIds)
      ).to.be.revertedWith("Batch mint exceeds max supply");
    });
  });

  // ==================== TRANSFER TESTS ====================
  describe("Transfers", function () {
    it("transfers token from owner to recipient", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      expect(await contract.ownerOf(1)).to.equal(user1.address);

      await contract.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await contract.ownerOf(1)).to.equal(user2.address);
    });

    it("safe transfers token", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user1).safeTransferFrom(user1.address, user2.address, 1)
      ).to.emit(contract, "Transfer")
        .withArgs(user1.address, user2.address, 1);

      expect(await contract.ownerOf(1)).to.equal(user2.address);
    });

    it("prevents transfer to zero address", async function () {
      const { contract, user1 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user1).transferFrom(user1.address, ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("prevents transfer by non-owner", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user2).transferFrom(user1.address, user3.address, 1)
      ).to.be.reverted;
    });

    it("allows approved spender to transfer", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.connect(user1).approve(user2.address, 1);

      await expect(
        contract.connect(user2).transferFrom(user1.address, user3.address, 1)
      ).to.emit(contract, "Transfer")
        .withArgs(user1.address, user3.address, 1);

      expect(await contract.ownerOf(1)).to.equal(user3.address);
    });

    it("allows operator to transfer", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.connect(user1).setApprovalForAll(user2.address, true);

      await expect(
        contract.connect(user2).transferFrom(user1.address, user3.address, 1)
      ).to.emit(contract, "Transfer")
        .withArgs(user1.address, user3.address, 1);

      expect(await contract.ownerOf(1)).to.equal(user3.address);
    });
  });

  // ==================== APPROVAL TESTS ====================
  describe("Approvals", function () {
    it("approves spender for single token", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(contract.connect(user1).approve(user2.address, 1))
        .to.emit(contract, "Approval")
        .withArgs(user1.address, user2.address, 1);

      expect(await contract.getApproved(1)).to.equal(user2.address);
    });

    it("returns correct approved spender", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.connect(user1).approve(user2.address, 1);

      expect(await contract.getApproved(1)).to.equal(user2.address);
    });

    it("revokes approval by approving zero address", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.connect(user1).approve(user2.address, 1);
      await contract.connect(user1).approve(ethers.ZeroAddress, 1);

      expect(await contract.getApproved(1)).to.equal(ethers.ZeroAddress);
    });

    it("prevents approval by non-owner non-operator", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user2).approve(user3.address, 1)
      ).to.be.reverted;
    });

    it("allows operator to approve", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.connect(user1).setApprovalForAll(user2.address, true);

      await expect(contract.connect(user2).approve(user3.address, 1))
        .to.emit(contract, "Approval");

      expect(await contract.getApproved(1)).to.equal(user3.address);
    });
  });

  // ==================== OPERATOR APPROVAL TESTS ====================
  describe("Operator Approvals", function () {
    it("sets approval for all tokens", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await expect(contract.connect(user1).setApprovalForAll(user2.address, true))
        .to.emit(contract, "ApprovalForAll")
        .withArgs(user1.address, user2.address, true);

      expect(await contract.isApprovedForAll(user1.address, user2.address)).to.be.true;
    });

    it("revokes approval for all tokens", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.connect(user1).setApprovalForAll(user2.address, true);
      await contract.connect(user1).setApprovalForAll(user2.address, false);

      expect(await contract.isApprovedForAll(user1.address, user2.address)).to.be.false;
    });

    it("prevents self-approval", async function () {
      const { contract, user1 } = await deployFixture();

      await expect(
        contract.connect(user1).setApprovalForAll(user1.address, true)
      ).to.be.revertedWith("Cannot approve yourself");
    });

    it("operator can transfer all tokens", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.safeMint(user1.address, 2);

      await contract.connect(user1).setApprovalForAll(user2.address, true);

      await contract.connect(user2).transferFrom(user1.address, user3.address, 1);
      await contract.connect(user2).transferFrom(user1.address, user3.address, 2);

      expect(await contract.balanceOf(user3.address)).to.equal(2);
    });
  });

  // ==================== METADATA TESTS ====================
  describe("Metadata", function () {
    it("returns correct token URI", async function () {
      const { contract, user1 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      const tokenURI = await contract.tokenURI(1);

      expect(tokenURI).to.equal("https://metadata.example.com/1");
    });

    it("updates base URI", async function () {
      const { contract } = await deployFixture();

      await expect(contract.setBaseURI("https://new.example.com/"))
        .to.emit(contract, "BaseURIUpdated")
        .withArgs("https://new.example.com/");

      const { user1 } = await deployFixture();
      await contract.safeMint(user1.address, 1);
      expect(await contract.tokenURI(1)).to.equal("https://new.example.com/1");
    });

    it("prevents updating base URI to empty string", async function () {
      const { contract } = await deployFixture();

      await expect(
        contract.setBaseURI("")
      ).to.be.revertedWith("Base URI cannot be empty");
    });

    it("reverts when querying URI of non-existent token", async function () {
      const { contract } = await deployFixture();

      await expect(
        contract.tokenURI(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  // ==================== BURNING TESTS ====================
  describe("Burning", function () {
    it("burns token by owner", async function () {
      const { contract, user1 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      expect(await contract.totalSupply()).to.equal(1);

      await expect(contract.connect(user1).burn(1))
        .to.emit(contract, "TokenBurned")
        .withArgs(1);

      expect(await contract.totalSupply()).to.equal(0);
      expect(await contract.balanceOf(user1.address)).to.equal(0);
    });

    it("contract owner can burn any token", async function () {
      const { contract, owner, user1 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      // Connect as owner to burn the token
      await expect(contract.connect(owner).burn(1))
        .to.emit(contract, "TokenBurned")
        .withArgs(1);

      expect(await contract.totalSupply()).to.equal(0);
    });

    it("prevents burning by non-owner", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user2).burn(1)
      ).to.be.reverted;
    });

    it("reduces total supply after burning", async function () {
      const { contract, user1 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.safeMint(user1.address, 2);

      expect(await contract.totalSupply()).to.equal(2);

      await contract.connect(user1).burn(1);
      expect(await contract.totalSupply()).to.equal(1);

      await contract.connect(user1).burn(2);
      expect(await contract.totalSupply()).to.equal(0);
    });

    it("allows reminting of burned token ID", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.connect(user1).burn(1);

      // Can mint token ID 1 again
      await contract.safeMint(user2.address, 1);
      expect(await contract.ownerOf(1)).to.equal(user2.address);
    });
  });

  // ==================== INVALID TOKEN TESTS ====================
  describe("Invalid Token Handling", function () {
    it("reverts when querying balance of non-existent token", async function () {
      const { contract } = await deployFixture();
      
      await expect(
        contract.ownerOf(999)
      ).to.be.reverted;
    });

    it("reverts on transfer of non-existent token", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await expect(
        contract.connect(user1).transferFrom(user1.address, user2.address, 999)
      ).to.be.reverted;
    });

    it("checks token existence correctly", async function () {
      const { contract, user1 } = await deployFixture();

      expect(await contract.tokenExists(1)).to.be.false;

      await contract.safeMint(user1.address, 1);
      expect(await contract.tokenExists(1)).to.be.true;

      await contract.connect(user1).burn(1);
      expect(await contract.tokenExists(1)).to.be.false;
    });

    it("validates token IDs", async function () {
      const { contract } = await deployFixture();

      expect(await contract.isValidTokenId(0)).to.be.false;
      expect(await contract.isValidTokenId(1)).to.be.true;
      expect(await contract.isValidTokenId(999)).to.be.true;
    });
  });

  // ==================== SUPPLY TESTS ====================
  describe("Supply Management", function () {
    it("returns correct remaining supply", async function () {
      const { contract, user1 } = await deployFixture();

      expect(await contract.remainingSupply()).to.equal(10);

      await contract.safeMint(user1.address, 1);
      expect(await contract.remainingSupply()).to.equal(9);

      await contract.safeMint(user1.address, 2);
      expect(await contract.remainingSupply()).to.equal(8);
    });

    it("tracks total supply correctly after multiple mints", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      expect(await contract.totalSupply()).to.equal(1);

      await contract.safeMint(user2.address, 2);
      expect(await contract.totalSupply()).to.equal(2);

      await contract.safeMint(user1.address, 3);
      expect(await contract.totalSupply()).to.equal(3);
    });
  });

  // ==================== ZERO ADDRESS TESTS ====================
  describe("Zero Address Validations", function () {
    it("prevents all operations to zero address", async function () {
      const { contract, user1 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user1).transferFrom(user1.address, ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Cannot transfer to zero address");

      await expect(
        contract.connect(user1).safeTransferFrom(user1.address, ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("prevents minting to zero address", async function () {
      const { contract } = await deployFixture();

      await expect(
        contract.safeMint(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });
  });

  // ==================== EVENT VERIFICATION TESTS ====================
  describe("Event Emissions", function () {
    it("emits Transfer event on mint", async function () {
      const { contract, user1 } = await deployFixture();

      await expect(contract.safeMint(user1.address, 1))
        .to.emit(contract, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, 1);
    });

    it("emits Transfer event on transfer", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.emit(contract, "Transfer")
        .withArgs(user1.address, user2.address, 1);
    });

    it("emits Approval event on approve", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(contract.connect(user1).approve(user2.address, 1))
        .to.emit(contract, "Approval")
        .withArgs(user1.address, user2.address, 1);
    });

    it("emits ApprovalForAll event", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await expect(contract.connect(user1).setApprovalForAll(user2.address, true))
        .to.emit(contract, "ApprovalForAll")
        .withArgs(user1.address, user2.address, true);
    });

    it("emits TokenMinted event", async function () {
      const { contract, user1 } = await deployFixture();

      await expect(contract.safeMint(user1.address, 1))
        .to.emit(contract, "TokenMinted")
        .withArgs(user1.address, 1);
    });

    it("emits TokenBurned event", async function () {
      const { contract, user1 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(contract.connect(user1).burn(1))
        .to.emit(contract, "TokenBurned")
        .withArgs(1);
    });

    it("emits BaseURIUpdated event", async function () {
      const { contract } = await deployFixture();

      await expect(contract.setBaseURI("https://new.example.com/"))
        .to.emit(contract, "BaseURIUpdated")
        .withArgs("https://new.example.com/");
    });
  });

  // ==================== GAS EFFICIENCY TESTS ====================
  describe("Gas Efficiency", function () {
    it("batch mint is more efficient than individual mints", async function () {
      const { contract, user1, user2 } = await deployFixture();

      // Single mints
      const singleTx = await contract.safeMint(user1.address, 1);
      const singleReceipt = await singleTx.wait();
      const singleGas = singleReceipt.gasUsed;

      // Batch mint
      const batchTx = await contract.batchMint(user2.address, [2, 3, 4, 5]);
      const batchReceipt = await batchTx.wait();
      const batchGas = batchReceipt.gasUsed;

      // Batch should be more efficient per token
      const gasPerTokenSingle = singleGas;
      const gasPerTokenBatch = batchGas / 4n;

      expect(gasPerTokenBatch).to.be.lt(gasPerTokenSingle);
    });

    it("transfers consume reasonable gas", async function () {
      const { contract, user1, user2 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      const tx = await contract.connect(user1).transferFrom(user1.address, user2.address, 1);
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lt(150000n);
    });
  });

  // ==================== UNAUTHORIZED OPERATION TESTS ====================
  describe("Unauthorized Operations", function () {
    it("prevents non-owner from calling setBaseURI", async function () {
      const { contract, user1 } = await deployFixture();

      await expect(
        contract.connect(user1).setBaseURI("https://new.example.com/")
      ).to.be.reverted;
    });

    it("prevents non-owner from batch minting", async function () {
      const { contract, user1 } = await deployFixture();

      await expect(
        contract.connect(user1).batchMint(user1.address, [1, 2, 3])
      ).to.be.reverted;
    });

    it("prevents transfer without approval", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);

      await expect(
        contract.connect(user2).transferFrom(user1.address, user3.address, 1)
      ).to.be.reverted;
    });

    it("approval doesn't persist after transfer", async function () {
      const { contract, user1, user2, user3 } = await deployFixture();

      await contract.safeMint(user1.address, 1);
      await contract.connect(user1).approve(user2.address, 1);

      await contract.connect(user2).transferFrom(user1.address, user3.address, 1);

      expect(await contract.getApproved(1)).to.equal(ethers.ZeroAddress);
    });
  });
});
