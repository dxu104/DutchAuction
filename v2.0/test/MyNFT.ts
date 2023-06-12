import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MyNFT } from "../typechain-types";

describe("MyNFT", function () {
  const TOKEN_URI = "uniqueIdentifierForMyNFT";

  async function deployNFTFixture() {
    const [owner, account1, account2] = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy();
    return { myNFT, owner, account1, account2 };
  }

  // Helper function for minting NFT
  async function mintNFT(contract: MyNFT, receiver: SignerWithAddress, tokenURI: string) {
    await expect(contract.mintNFT(receiver.address, tokenURI))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, receiver.address, 0);
  }

  // Helper function for transferring NFT
  async function transferNFT(contract: MyNFT, from: SignerWithAddress, to: SignerWithAddress, tokenId: number) {
    await expect(
      contract.transferFrom(from.address, to.address, tokenId)
    )
      .to.emit(contract, "Transfer")
      .withArgs(from.address, to.address, tokenId);
  }

  describe("Deployment", function () {
    it("Should mint NFT with the provided tokenUri correctly", async function () {
      const { myNFT, owner } = await loadFixture(deployNFTFixture);

      await mintNFT(myNFT, owner, TOKEN_URI);
      expect(await myNFT.tokenURI(0)).to.equal(TOKEN_URI);
    });
  });

    

    it("Should grant the owner permission to mint NFTs and trigger corresponding events", async function () {
      const { myNFT, owner } = await loadFixture(deployNFTFixture);
      await mintNFT(myNFT, owner, TOKEN_URI);
    });
    it("Should correctly assign the contract owner", async function () {
      const { myNFT, owner } = await loadFixture(deployNFTFixture);
      expect(await myNFT.owner()).to.equal(owner.address);
    });
    
  it("Should restrict NFT minting to the owner only", async function () {
    const { myNFT, owner, account1 } = await loadFixture(
      deployNFTFixture
    );

    await expect(
      myNFT.connect(account1).mintNFT(owner.address, TOKEN_URI)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  describe("Transfers & Approvals", function () {
    it("Should permit the NFT's owner to transfer the token", async function () {
      const { myNFT, owner, account1 } = await loadFixture(
        deployNFTFixture
      );

      await mintNFT(myNFT, owner, TOKEN_URI);
      await transferNFT(myNFT, owner, account1, 0);
    });

    it("Should permit the token recipient to transfer the NFT once received", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await mintNFT(myNFT, owner, TOKEN_URI);
      await transferNFT(myNFT, owner, account1, 0);

      await expect(
        myNFT
          .connect(account1)
          .transferFrom(account1.address, account2.address, 0)
      )
        .to.emit(myNFT, "Transfer")
        .withArgs(account1.address, account2.address, 0);
    });

    it("Should restrict NFT transfer from addresses that do not own the token unless they have been approved", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await mintNFT(myNFT, owner, TOKEN_URI);
      await transferNFT(myNFT, owner, account1, 0);

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

    it("Should permit only the addresses that own the token to set ERC721 approvals", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await mintNFT(myNFT, owner, TOKEN_URI);
      await transferNFT(myNFT, owner, account1, 0);

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

    it("Should permit addresses approved for token transfer to transfer the NFT", async function () {
      const { myNFT, owner, account1, account2 } = await loadFixture(
        deployNFTFixture
      );

      await mintNFT(myNFT, owner, TOKEN_URI);
      await transferNFT(myNFT, owner, account1, 0);

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
