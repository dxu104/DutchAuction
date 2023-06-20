import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTDutchAuctionERC20Bids } from "../typechain-types/contracts/NFTDutchAuction_ECR20Bids.sol";

describe("NFTDutchAuctionERC20Bids", function () {
  
  const NUM_BLOCKS_AUCTION_OPEN: number = 20;
  const RESERVE_PRICE: number = 1000;
  const OFFER_PRICE_DECREMENT: number = 100;
  const NFT_TOKEN_ID: number = 0;
  const TOKEN_URI = "uniqueIdentifierForMyNFT";

  async function deployNFTDAFixture() {
    const [owner, account1, account2] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy();
    await myNFT.mintNFT(owner.address, TOKEN_URI);

    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy();
    await myToken.mint(account1.address, 1000);

    const NFTDutchAuctionERC20Bids = await ethers.getContractFactory(
      "NFTDutchAuctionERC20Bids"
    );

    const nftDutchAuctionERC20Bids = await NFTDutchAuctionERC20Bids.deploy(
      myToken.address,
      myNFT.address,
      NFT_TOKEN_ID,
      RESERVE_PRICE,
      NUM_BLOCKS_AUCTION_OPEN,
      OFFER_PRICE_DECREMENT
    );

    myNFT.approve(nftDutchAuctionERC20Bids.address, NFT_TOKEN_ID);

    return {
      myNFT,
      myToken,
      nftDutchAuctionERC20Bids,
      owner,
      account1,
      account2,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { nftDutchAuctionERC20Bids, owner } = await loadFixture(
        deployNFTDAFixture
      );

      expect(await nftDutchAuctionERC20Bids.owner()).to.equal(owner.address);
    });

    it("Should have no winner", async function () {
      const { nftDutchAuctionERC20Bids } = await loadFixture(
        deployNFTDAFixture
      );

      expect(await nftDutchAuctionERC20Bids.winner()).to.equal(
        ethers.constants.AddressZero
      );
    });

    it("Should not allow Auction creator to deploy contract if the NFT does not belong to them", async function () {
      const { myNFT, myToken, account1 } = await loadFixture(
        deployNFTDAFixture
      );

      await expect(myNFT.mintNFT(account1.address, "Test URI"))
        .to.emit(myNFT, "Transfer")
        .withArgs(ethers.constants.AddressZero, account1.address, 1);

      const NFTDutchAuctionERC20Bids = await ethers.getContractFactory(
        "NFTDutchAuctionERC20Bids"
      );
      await expect(
        NFTDutchAuctionERC20Bids.deploy(
          myToken.address,
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

    it("Should have the initial price as per Dutch Auction formula", async function () {
      const { nftDutchAuctionERC20Bids } = await loadFixture(
        deployNFTDAFixture
      );

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;

      expect(await nftDutchAuctionERC20Bids.initialPrice()).to.equal(
        initialPrice
      );
    });
  });

  describe("Bids", function () {
    it("Should have expected current price after 10 blocks as per formula", async function () {
      const { nftDutchAuctionERC20Bids } = await loadFixture(
        deployNFTDAFixture
      );

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;

      const priceAfter5Blocks = initialPrice - 9 * OFFER_PRICE_DECREMENT;
      await mine(9);

      expect(await nftDutchAuctionERC20Bids.getCurrentPrice()).to.equal(
        priceAfter5Blocks
      );
    });

    it("Should reject low bids", async function () {
      const { nftDutchAuctionERC20Bids, account1 } = await loadFixture(
        deployNFTDAFixture
      );

      await mine(1);

      const lowBidPrice =
        RESERVE_PRICE +
        NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT -
        OFFER_PRICE_DECREMENT * 10;

      await expect(
        nftDutchAuctionERC20Bids.connect(account1).bid(lowBidPrice)
      ).to.be.revertedWith("The bid amount sent is not acceptable");

      await expect(
        nftDutchAuctionERC20Bids.connect(account1).bid(100)
      ).to.be.revertedWith("The bid amount sent is not acceptable");
    });

    it("Should acknowledge bids higher than currentPrice but still fail if proper allowance is not set to the contract's address", async function () {
      const { nftDutchAuctionERC20Bids, myToken, account1 } =
        await loadFixture(deployNFTDAFixture);
      await mine(10);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 9;

      await expect(
        nftDutchAuctionERC20Bids.connect(account1).bid(highBidPrice)
      ).to.be.revertedWith(
        "Bid amount was accepted, but bid failed as not enough balance/allowance to transfer erc20 token TMP"
      );

      await myToken
        .connect(account1)
        .approve(nftDutchAuctionERC20Bids.address, highBidPrice - 10);

      await expect(
        nftDutchAuctionERC20Bids.connect(account1).bid(highBidPrice)
      ).to.be.revertedWith(
        "Bid amount was accepted, but bid failed as not enough balance/allowance to transfer erc20 token TMP"
      );
    });
   

    it("Bids should not be accepted after the auction expires", async function () {
      const { nftDutchAuctionERC20Bids, account1, account2 } =
        await loadFixture(deployNFTDAFixture);
      await mine(NUM_BLOCKS_AUCTION_OPEN + 1);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 9;

      await expect(
        nftDutchAuctionERC20Bids.connect(account2).bid(highBidPrice)
      ).to.be.revertedWith("Auction expired");
    });

    it("Should return reservePrice when max number of auction blocks have elapsed", async function () {
      const { nftDutchAuctionERC20Bids } = await loadFixture(
        deployNFTDAFixture
      );
      await mine(NUM_BLOCKS_AUCTION_OPEN);
      expect(await nftDutchAuctionERC20Bids.getCurrentPrice()).to.equal(
        RESERVE_PRICE
      );

      await mine(10);
      expect(await nftDutchAuctionERC20Bids.getCurrentPrice()).to.equal(
        RESERVE_PRICE
      );
    });

  
    it("Owner should still own the NFT after the auction expires if there is no winning bid", async function () {
      const { nftDutchAuctionERC20Bids, myNFT, owner, account2 } =
        await loadFixture(deployNFTDAFixture);
      await mine(NUM_BLOCKS_AUCTION_OPEN + 1);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 9;

      await expect(
        nftDutchAuctionERC20Bids.connect(account2).bid(highBidPrice)
      ).to.be.revertedWith("Auction expired");

      expect(await myNFT.ownerOf(NFT_TOKEN_ID)).to.equal(
        owner.address
      );
    });


  it("Should transfer the NFT from Owner's account to Bidder's account", async function () {
    const {
      nftDutchAuctionERC20Bids,
      myToken,
      myNFT,
      owner,
      account1,
    } = await loadFixture(deployNFTDAFixture);
  
    await myNFT.connect(owner).approve(nftDutchAuctionERC20Bids.address, NFT_TOKEN_ID);
  
    await mine(10);
  
    const initialPrice =
      RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
    const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 9;
  
    await myToken.transfer(account1.address, highBidPrice);
    await myToken
      .connect(account1)
      .approve(nftDutchAuctionERC20Bids.address, highBidPrice);
    await expect(nftDutchAuctionERC20Bids.connect(account1).bid(highBidPrice))
      .to.emit(myNFT, "Transfer")
      .withArgs(owner.address, account1.address, NFT_TOKEN_ID);
    expect(await myNFT.ownerOf(NFT_TOKEN_ID)).to.equal(
      account1.address
    );
  });
  });
});