import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFTDutchAuction", function () {
  const NUM_BLOCKS_AUCTION_OPEN = 200;
  const RESERVE_PRICE = 1000;
  const OFFER_PRICE_DECREMENT = 20;
  const NFT_TOKEN_ID = 0;
  const TOKEN_URI = "uniqueIdentifierForMyNFT";

  async function deployNFTDAFixture() {
    const [owner, account1, account2] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy();

    await myNFT.mintNFT(owner.address, TOKEN_URI);

    const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction");

    const nftDutchAuction = await NFTDutchAuction.deploy(
      myNFT.address,
      NFT_TOKEN_ID,
      RESERVE_PRICE,
      NUM_BLOCKS_AUCTION_OPEN,
      OFFER_PRICE_DECREMENT
    );

    myNFT.approve(nftDutchAuction.address, NFT_TOKEN_ID);

    return { myNFT, nftDutchAuction, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("The contract owner should be correctly initialized at deployment", async function () {
      const { nftDutchAuction, owner } = await loadFixture(deployNFTDAFixture);

      expect(await nftDutchAuction.owner()).to.equal(owner.address);
    });

    it("The winner should be undefined at the beginning of the auction", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);

      expect(await nftDutchAuction.winner()).to.equal(
        ethers.constants.AddressZero
      );
    });

    it("The auction contract deployment should fail if the NFT does not belong to the contract creator", async function () {
      const { myNFT, account1 } = await loadFixture(deployNFTDAFixture);

      await expect(myNFT.mintNFT(account1.address, "Test URI"))
        .to.emit(myNFT, "Transfer")
        .withArgs(ethers.constants.AddressZero, account1.address, 1);

      const NFTDutchAuction = await ethers.getContractFactory(
        "NFTDutchAuction"
      );
      await expect(
        NFTDutchAuction.deploy(
          myNFT.address,
          1,
          RESERVE_PRICE,
          NUM_BLOCKS_AUCTION_OPEN,
          OFFER_PRICE_DECREMENT
        )
      ).to.revertedWith(
        "The NFT tokenId does not belong to the Auction's Owner"
      );
    });

    it("The initial price should correctly reflect the Dutch Auction formula", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;

      expect(await nftDutchAuction.initialPrice()).to.equal(initialPrice);
    });
  });

  describe("Bids", function () {
    it("The current price after 10 blocks should be as calculated per the formula", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;

      const priceAfter5Blocks = initialPrice - 10 * OFFER_PRICE_DECREMENT;
      await mine(10);

      expect(await nftDutchAuction.getCurrentPrice()).to.equal(
        priceAfter5Blocks
      );
    });

    it("The contract should not accept bids lower than the current price", async function () {
      const { nftDutchAuction, account1 } = await loadFixture(
        deployNFTDAFixture
      );

      await mine(1);

      const lowBidPrice =
        RESERVE_PRICE +
        NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT -
        OFFER_PRICE_DECREMENT * 10;

      await expect(
        nftDutchAuction.connect(account1).placeBid({
          value: lowBidPrice,
        })
      ).to.be.revertedWith("The wei value sent is not acceptable");

      await expect(
        nftDutchAuction.connect(account1).placeBid({
          value: 20,
        })
      ).to.be.revertedWith("The wei value sent is not acceptable");
    });

    it("The contract should reject any bids after the expiration of the auction", async function () {
      const { nftDutchAuction, account1, account2 } = await loadFixture(
        deployNFTDAFixture
      );
      await mine(NUM_BLOCKS_AUCTION_OPEN + 1);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 9;

      await expect(
        nftDutchAuction.connect(account2).placeBid({
          value: highBidPrice,
        })
      ).to.be.revertedWith("Auction expired");
    });

    it("The current price should fall to the reserve price when the maximum number of auction blocks have been mined", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);
      await mine(NUM_BLOCKS_AUCTION_OPEN);
      expect(await nftDutchAuction.getCurrentPrice()).to.equal(RESERVE_PRICE);

      await mine(10);
      expect(await nftDutchAuction.getCurrentPrice()).to.equal(RESERVE_PRICE);
    });

    it("The NFT should be successfully transferred from the owner's account to the highest bidder's account", async function () {
      const { nftDutchAuction, myNFT, owner, account1 } = await loadFixture(
        deployNFTDAFixture
      );

      await myNFT.connect(owner).approve(nftDutchAuction.address, NFT_TOKEN_ID);

      await mine(10);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 9;

      await expect(
        nftDutchAuction.connect(account1).placeBid({
          value: highBidPrice,
        })
      )
        .to.emit(myNFT, "Transfer")
        .withArgs(owner.address, account1.address, NFT_TOKEN_ID);

      expect(await myNFT.ownerOf(NFT_TOKEN_ID)).to.equal(account1.address);
    });

    it("The current price should be the reserve price when the blocks elapsed are equal to numBlocksAuctionOpen", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);
      await mine(NUM_BLOCKS_AUCTION_OPEN);
      expect(await nftDutchAuction.getCurrentPrice()).to.equal(RESERVE_PRICE);
    });

    


  });
});
