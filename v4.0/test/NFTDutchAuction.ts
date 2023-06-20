import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import "@nomiclabs/hardhat-ethers";
const { ethers, upgrades, network } = require("hardhat");
import { expect } from "chai";

const _reservePrice = "150";
const _numBlocksAuctionOpen = 30;
const _offerPriceDecrement = "1";

describe("DutchAuction", function () {
  async function deployDutchAuctionTestFixture() {
    const [owner, firstAcc, secondAcc] = await ethers.getSigners();
    const nftAuctionFactory = await ethers.getContractFactory("MyNFT");
    const nftAuctionContract = await nftAuctionFactory.deploy();

    await nftAuctionContract.mintNFT(firstAcc.address);

    const tokenAuctionFactory = await ethers.getContractFactory("MyToken");
    const tokenAuctionContract = await tokenAuctionFactory.deploy("500");

    const auctionFactory = await ethers.getContractFactory(
      "NFTDutchAuctionERC20"
    );
    const auctionContract = await upgrades.deployProxy(
      auctionFactory,
      [
        tokenAuctionContract.address,
        nftAuctionContract.address,
        1,
        ethers.utils.parseUnits(_reservePrice, 18),
        _numBlocksAuctionOpen,
        ethers.utils.parseUnits(_offerPriceDecrement, 18),
      ],
      { kind: "uups" }
    );

    await nftAuctionContract
      .connect(firstAcc)
      .approve(auctionContract.address, 1);
    await tokenAuctionContract
      .connect(owner)
      .increaseAllowance(
        auctionContract.address,
        ethers.utils.parseUnits("1010", 18)
      );

    return {
      nftAuctionContract,
      tokenAuctionContract,
      auctionContract,
      owner,
      firstAcc,
      secondAcc,
    };
  }

  describe("Deployment", function () {
    it("should fail when the initializer is attempted to be called more than once", async function () {
      const {
        auctionContract,
        owner,
        firstAcc,
        tokenAuctionContract,
        nftAuctionContract,
      } = await loadFixture(deployDutchAuctionTestFixture);

      const erc20TokenAddress = tokenAuctionContract.address;
      const erc721TokenAddress = nftAuctionContract.address;
      const _nftTokenId = 1;
      const _reservePrice = ethers.utils.parseUnits("200", 18);
      const _numBlocksAuctionOpen = 10;
      const _offerPriceDecrement = ethers.utils.parseUnits("10", 18);

      await expect(
        auctionContract.initialize(
          erc20TokenAddress,
          erc721TokenAddress,
          _nftTokenId,
          _reservePrice,
          _numBlocksAuctionOpen,
          _offerPriceDecrement
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("Verify that finalizeBid operation fails if the NFT isn't escrowed", async function () {
      const { nftAuctionContract, auctionContract, owner, firstAcc } =
        await loadFixture(deployDutchAuctionTestFixture);

      await expect(
        auctionContract.testFinalizeBid(ethers.utils.parseUnits("100", 18))
      ).to.be.revertedWith("The NFT for the auction is not held in escrow.");
    });

    it("Validate that the NFT is correctly escrowed in the auction contract", async function () {
      const { nftAuctionContract, auctionContract, firstAcc } =
        await loadFixture(deployDutchAuctionTestFixture);

      const contractBalancePre = await nftAuctionContract.balanceOf(
        auctionContract.address
      );
      await auctionContract.connect(firstAcc).startAuction();
      const contractBalancePost = await nftAuctionContract.balanceOf(
        auctionContract.address
      );

      expect(contractBalancePre).to.equal(
        contractBalancePost.sub(ethers.BigNumber.from("1"))
      );
    });

    it("Confirm that the NFT is correctly removed from the seller's wallet", async function () {
      const { nftAuctionContract, auctionContract, firstAcc } =
        await loadFixture(deployDutchAuctionTestFixture);

      const ownerBalancePre = await nftAuctionContract.balanceOf(
        firstAcc.address
      );
      await auctionContract.connect(firstAcc).startAuction();
      const ownerBalancePost = await nftAuctionContract.balanceOf(
        firstAcc.address
      );

      expect(ownerBalancePre).to.equal(
        ownerBalancePost.add(ethers.BigNumber.from("1"))
      );
    });

    it("Confirm that the NFT is correctly transferred to the highest bidder's wallet upon receiving the top bid", async function () {
      const { nftAuctionContract, owner, auctionContract, firstAcc } =
        await loadFixture(deployDutchAuctionTestFixture);

      await auctionContract.connect(firstAcc).startAuction();
      const buyerBalancePre = await nftAuctionContract.balanceOf(owner.address);
      await auctionContract
        .connect(owner)
        .bid(ethers.utils.parseUnits("200", 18));
      const buyerBalancePost = await nftAuctionContract.balanceOf(
        owner.address
      );

      expect(buyerBalancePost).to.equal(
        buyerBalancePre.add(ethers.BigNumber.from("1"))
      );
    });

    it("Confirm that ERC20 tokens are correctly deposited into the seller's wallet after the successful completion of the auction", async function () {
      const {
        auctionContract,
        tokenAuctionContract,
        owner,
        firstAcc,
        secondAcc,
      } = await loadFixture(deployDutchAuctionTestFixture);

      await auctionContract.connect(firstAcc).startAuction();
      let sellerBalancePre = await tokenAuctionContract.balanceOf(
        firstAcc.address
      );
      await auctionContract
        .connect(owner)
        .bid(ethers.utils.parseUnits("200", 18));
      let sellerBalancePost = await tokenAuctionContract.balanceOf(
        firstAcc.address
      );

      expect(sellerBalancePost).to.equal(
        sellerBalancePre.add(ethers.utils.parseUnits("200", 18))
      );
    });

    it("Verify that ERC20 tokens are correctly deducted from the winning bidder's wallet after the successful completion of the auction", async function () {
      const {
        auctionContract,
        tokenAuctionContract,
        owner,
        firstAcc,
        secondAcc,
      } = await loadFixture(deployDutchAuctionTestFixture);

      await auctionContract.connect(firstAcc).startAuction();
      let sellerBalancePre = await tokenAuctionContract.balanceOf(
        owner.address
      );
      await auctionContract
        .connect(owner)
        .bid(ethers.utils.parseUnits("200", 18));
      let sellerBalancePost = await tokenAuctionContract.balanceOf(
        owner.address
      );

      expect(sellerBalancePost).to.equal(
        sellerBalancePre.sub(ethers.utils.parseUnits("200", 18))
      );
    });

    it("Confirm that the NFT is correctly transferred back to the seller's wallet if the auction fails", async function () {
      const { nftAuctionContract, auctionContract, firstAcc } =
        await loadFixture(deployDutchAuctionTestFixture);

      await auctionContract.connect(firstAcc).startAuction();
      const sellerBalancePre = await nftAuctionContract.balanceOf(
        firstAcc.address
      );
      await network.provider.send("hardhat_mine", ["0x100"]);
      await auctionContract.connect(firstAcc).cancelAuction();
      const sellerBalancePost = await nftAuctionContract.balanceOf(
        firstAcc.address
      );

      expect(sellerBalancePre).to.equal(
        sellerBalancePost.sub(ethers.BigNumber.from("1"))
      );
    });

    it("Confirm that only the NFT owner can execute the cancelAuction function", async function () {
      const { auctionContract, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await auctionContract.connect(firstAcc).startAuction();

      await expect(auctionContract.cancelAuction()).revertedWith(
        "This operation is invalid, it can only be performed by the NFT owner."
      );
    });

    it("Verify that the initiator of the auction is the actual owner of the NFT", async function () {
      const { auctionContract } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await expect(auctionContract.startAuction()).revertedWith(
        "The auction can only be initiated by the owner of the NFT."
      );
    });

    it("Ensure the auction stops accepting new bids from the winning bidder after a bid is accepted", async function () {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await auctionContract.connect(firstAcc).startAuction();
      await auctionContract
        .connect(owner)
        .bid(ethers.utils.parseUnits("180", 18));

      await expect(
        auctionContract.connect(owner).bid(ethers.utils.parseUnits("180", 18))
      ).revertedWith("Bidding is closed, the auction has already concluded.");
    });

    it("Ensure the auction stops accepting new bids from non-winning bidders after a bid is accepted", async function () {
      const { auctionContract, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await auctionContract.connect(firstAcc).startAuction();
      await auctionContract.bid(ethers.utils.parseUnits("180", 18));

      await expect(
        auctionContract
          .connect(firstAcc)
          .bid(ethers.utils.parseUnits("180", 18))
      ).revertedWith("Bidding is closed, the auction has already concluded.");
    });

    it("Confirm the auction stops accepting bids after the auction end time (block) has passed", async function () {
      const { auctionContract, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await auctionContract.connect(firstAcc).startAuction();
      await network.provider.send("hardhat_mine", ["0x100"]);

      await expect(
        auctionContract.bid(ethers.utils.parseUnits("180", 18))
      ).to.be.revertedWith(
        "Bidding is closed, the auction has already concluded."
      );
    });

    it("Verify bids are rejected if the bid amount is less than the minimum required auction price", async function () {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await auctionContract.connect(firstAcc).startAuction();

      await expect(
        auctionContract.connect(owner).bid(ethers.utils.parseUnits("50", 18))
      ).revertedWith(
        "The amount of your bid is under the current required auction price."
      );
    });

    it("Ensure bidder transactions are rejected if insufficient token allowance is provided to the auction smart contract", async function () {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await auctionContract.connect(firstAcc).startAuction();

      await expect(
        auctionContract.connect(owner).bid(ethers.utils.parseUnits("1100", 18))
      ).revertedWith("There's not enough token allowance for this operation.");
    });

    it("Confirm bidder transactions are rejected if the bidder's balance is insufficient", async function () {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await auctionContract.connect(firstAcc).startAuction();

      await expect(
        auctionContract.connect(owner).bid(ethers.utils.parseUnits("1005", 18))
      ).revertedWith(
        "Your wallet balance is insufficient for this transaction."
      );
    });

    it("Verify that the NFT is correctly escrowed within the auction smart contract", async function () {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );

      await expect(auctionContract.connect(owner).cancelAuction()).revertedWith(
        "The NFT for the auction is not held in escrow."
      );
    });

    it("Ensure the bid operation fails if attempted before the start of the auction", async () => {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );
      const amount = ethers.utils.parseEther("1");
      await expect(auctionContract.bid(amount)).to.be.revertedWith(
        "The auction has not yet commenced!"
      );
    });

    it("Confirm the cancelAuction operation fails if executed before the NFT is escrowed", async () => {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );
      await expect(auctionContract.cancelAuction()).to.be.revertedWith(
        "The NFT for the auction is not held in escrow."
      );
    });

    it("should verify that attempting to bid before the auction begins leads to failure", async function () {
      const { auctionContract, owner, firstAcc } = await loadFixture(
        deployDutchAuctionTestFixture
      );
      await auctionContract.connect(firstAcc).startAuction();

      await auctionContract.endAuctionEarly(true);

      await expect(
        auctionContract.connect(firstAcc).cancelAuction()
      ).to.be.revertedWith(
        "The auction can't be stopped as it has already been successfully concluded."
      );
    });
  });

  describe("Upgradable", () => {
    it("Checking if the getHelloWorld function returns 'Hello, World!'", async () => {
      const { auctionContract } = await loadFixture(
        deployDutchAuctionTestFixture
      );
      const auctionContractUpgrade = await ethers.getContractFactory(
        "NFTDutchAuction_ERC20Upgraded"
      );
      const auctionContractUpgradeDeploy = await upgrades.upgradeProxy(
        auctionContract.address,
        auctionContractUpgrade
      );

      expect(await auctionContractUpgradeDeploy.getHelloWorld()).to.equal(
        "Hello, World!"
      );
    });
  });
});
