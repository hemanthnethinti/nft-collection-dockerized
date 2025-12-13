import "@nomicfoundation/hardhat-ethers";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.20",
};

const { expect } = require("chai");

describe("NFT", function () {
  it("Should deploy", async function () {
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy();
    await nft.deployed();
    expect(await nft.name()).to.exist;
  });
});
