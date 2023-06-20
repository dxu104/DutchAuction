import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

describe("MyNFT", function () {
  const TOKEN_URI = "uniqueIdentifierForMyNFT";

  async function deployNFTFixture() {
    const [owner, account1, account2] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");

    const myNFT = await MyNFT.deploy();

    return { myNFT, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { myNFT, owner } = await loadFixture(deployNFTFixture);

      expect(await myNFT.owner()).to.equal(owner.address);
    });

    it("Should allow owner to mint an NFT and emit minting/transfer event", async function () {
      const { myNFT, owner } = await loadFixture(deployNFTFixture);

      await expect(myNFT.mintNFT(owner.address, TOKEN_URI))
        .to.emit(myNFT, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 0);
    });

    it("Should not allow non-owner addresses to mint an NFT", async function () {
      const { myNFT, owner, account1 } = await loadFixture(
        deployNFTFixture
      );

      await expect(
        myNFT.connect(account1).mintNFT(owner.address, TOKEN_URI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should mint NFT with correct tokenUri", async function () {
      const { myNFT, owner } = await loadFixture(deployNFTFixture);

      await myNFT.mintNFT(owner.address, TOKEN_URI);

      expect(await myNFT.tokenURI(0)).to.equal(TOKEN_URI);
    });
  });

  describe("Transfers & Approvals", function () {
    it("Should allow owner to transfer the NFT", async function () {
      const { myNFT, owner, account1 } = await loadFixture(
        deployNFTFixture
      );

      await myNFT.mintNFT(owner.address, TOKEN_URI);

      await expect(
        myNFT.transferFrom(owner.address, account1.address, 0)
      )
        .to.emit(myNFT, "Transfer")
        .withArgs(owner.address, account1.address, 0);
    });

    it("Should allow recipient to transfer the NFT after receiving the token", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await myNFT.mintNFT(owner.address, TOKEN_URI);

      await myNFT.transferFrom(owner.address, account1.address, 0);

      await expect(
        myNFT
          .connect(account1)
          .transferFrom(account1.address, account2.address, 0)
      )
        .to.emit(myNFT, "Transfer")
        .withArgs(account1.address, account2.address, 0);
    });

    it("Should not allow non-token-owning addresses to transfer the NFT unless approved", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await myNFT.mintNFT(owner.address, TOKEN_URI);

      await myNFT.transferFrom(owner.address, account1.address, 0);

      await expect(
        myNFT
          .connect(account2)
          .transferFrom(account1.address, account2.address, 0)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");

      await expect(
        myNFT
          .connect(owner)
          .transferFrom(account1.address, account2.address, 0)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should allow only token-owner addresses to set ERC721 approvals", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await myNFT.mintNFT(owner.address, TOKEN_URI);

      await myNFT.transferFrom(owner.address, account1.address, 0);

      await expect(
        myNFT.connect(account2).approve(account2.address, 0)
      ).to.be.revertedWith(
        "ERC721: approve caller is not token owner or approved for all"
      );

      await expect(
        myNFT.connect(owner).approve(account2.address, 0)
      ).to.be.revertedWith(
        "ERC721: approve caller is not token owner or approved for all"
      );

      await expect(
        myNFT.connect(account1).approve(account2.address, 0)
      )
        .to.emit(myNFT, "Approval")
        .withArgs(account1.address, account2.address, 0);
    });

    it("Should allow approved addresses to transfer the NFT", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await myNFT.mintNFT(owner.address, TOKEN_URI);

      await myNFT.transferFrom(owner.address, account1.address, 0);

      myNFT.connect(account1).approve(owner.address, 0);

      await expect(
        myNFT
          .connect(account2)
          .transferFrom(account1.address, account2.address, 0)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");

      await expect(
        myNFT
          .connect(owner)
          .transferFrom(account1.address, account2.address, 0)
      )
        .to.emit(myNFT, "Transfer")
        .withArgs(account1.address, account2.address, 0);
    });
  });
});