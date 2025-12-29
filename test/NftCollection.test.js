const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftCollection", function () {

  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const NftCollection = await ethers.getContractFactory("NftCollection");
    const contract = await NftCollection.deploy(
      "MyNFT",
      "MNFT",
      5,
      "https://meta.example/"
    );

    return { contract, owner, user1, user2 };
  }

  it("deploys with correct config", async function () {
    const { contract } = await deployFixture();

    expect(await contract.name()).to.equal("MyNFT");
    expect(await contract.symbol()).to.equal("MNFT");
    expect(await contract.maxSupply()).to.equal(5);
    expect(await contract.totalSupply()).to.equal(0);
  });

  it("only owner can mint", async function () {
    const { contract, user1 } = await deployFixture();

          await expect(
        contract.connect(user1).safeMint(user1.address, 1)
      ).to.be.reverted;

  });

  it("mints successfully and updates balances", async function () {
    const { contract, owner, user1 } = await deployFixture();

    await contract.safeMint(user1.address, 1);

    expect(await contract.totalSupply()).to.equal(1);
    expect(await contract.ownerOf(1)).to.equal(user1.address);
    expect(await contract.balanceOf(user1.address)).to.equal(1);
  });

  it("prevents double minting", async function () {
    const { contract, owner, user1 } = await deployFixture();

    await contract.safeMint(user1.address, 1);

    await expect(
      contract.safeMint(user1.address, 1)
    ).to.be.revertedWith("Already minted");
  });

  it("enforces max supply", async function () {
    const { contract, owner, user1 } = await deployFixture();

    await contract.safeMint(user1.address, 1);
    await contract.safeMint(user1.address, 2);
    await contract.safeMint(user1.address, 3);
    await contract.safeMint(user1.address, 4);
    await contract.safeMint(user1.address, 5);

    await expect(
      contract.safeMint(user1.address, 6)
    ).to.be.revertedWith("Max supply reached");
  });

  it("prevents mint to zero address", async function () {
    const { contract } = await deployFixture();

    await expect(
      contract.safeMint(ethers.ZeroAddress, 1)
    ).to.be.revertedWith("Zero address");
  });
});
