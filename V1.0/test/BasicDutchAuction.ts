import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

import { expect } from 'chai';
import { Signer } from "ethers";
import { BasicDutchAuction } from '../typechain-types/BasicDutchAuction';

describe('BasicDutchAuction', () => {
  let basicDutchAuction: BasicDutchAuction;
  let owner: Signer;
  let participant1: Signer;
  let participant2: Signer;

  const minimumAcceptablePrice: number = 5000;
  const auctionDurationInBlocks: number = 20;
  const priceDecrementPerBlock: number = 500;
  const bidValue1: BigNumber = ethers.utils.parseEther("100");

  // Updated test case names for clarity
  beforeEach(async () => {
    [owner, participant1, participant2] = await ethers.getSigners();
    const BasicDutchAuctionFactory = await ethers.getContractFactory('BasicDutchAuction');
    basicDutchAuction = await BasicDutchAuctionFactory.deploy(
      minimumAcceptablePrice,
      auctionDurationInBlocks,
      priceDecrementPerBlock
    ) as BasicDutchAuction;
    
  });

  it( 'should initialize contract variables correctly', async () => {
    expect(await basicDutchAuction.auctionCreator()).to.equal(await owner.getAddress());
    expect(await basicDutchAuction.minimumAcceptablePrice()).to.equal(minimumAcceptablePrice);
    expect(await basicDutchAuction.auctionDurationInBlocks()).to.equal(auctionDurationInBlocks);
    expect(await basicDutchAuction.priceDecrementPerBlock()).to.equal(priceDecrementPerBlock);
  });

  it( 'should allow the initial participant to place bid and forward it to the auction creator', async function() {
    const bidValue1: BigNumber = ethers.utils.parseEther("100");
    await basicDutchAuction.connect(participant1).placeBid({ value: bidValue1 });
    expect(await basicDutchAuction.initialParticipant()).to.equal(await participant1.getAddress());
    expect(await basicDutchAuction.initialBidValue()).to.equal(bidValue1);
    expect(await basicDutchAuction.getBalance(await owner.getAddress())).to.equal(bidValue1);
  });

  it( "should fail if there's no refund to retrieve", async function() {
    await expect(basicDutchAuction.connect(participant1).retrieveRefund()).to.be.revertedWith("No refund available for the account");
  });

  it("should fail if the bid is less than the ongoing auction price", async function() {
    const currentPrice: BigNumber = (await basicDutchAuction.getCurrentAuctionPrice()).sub(1);
    await expect(basicDutchAuction.connect(participant1).placeBid({value: currentPrice})).to.be.revertedWith("Submitted bid value is lower than the current price");
  });

  it("should fail if the bid is less than zero", async function() {
    const bidValue: BigNumber = ethers.utils.parseEther("0");
    await expect(basicDutchAuction.connect(participant1).placeBid({value: bidValue})).to.be.revertedWith("Submitted bid value must be greater than 0");
  });

  it("should reimburse bids following the winner's bid and stop accepting further bids", async function() {
    const bidValue1: BigNumber = ethers.utils.parseEther("400");
    const bidValue2: BigNumber = ethers.utils.parseEther("300");
    expect(await basicDutchAuction.hasReceivedValidBid()).to.be.false;
    await basicDutchAuction.connect(participant2).placeBid({ value: bidValue2 });
    expect(await basicDutchAuction.hasReceivedValidBid()).to.be.true;
    await basicDutchAuction.connect(participant1).placeBid({ value: bidValue1 });
    const amountbeforeClaim: BigNumber = await basicDutchAuction.getBalance(await participant1.getAddress());
    await basicDutchAuction.connect(participant1).retrieveRefund();
    const amountafterClaim: BigNumber = await basicDutchAuction.getBalance(await participant1.getAddress());
    const difference: BigNumber = amountbeforeClaim.sub(amountafterClaim);
    expect(difference).to.equal(bidValue1);
  });

  it("should return zero when the number of blocks surpasses the auction's end time", async () => {
    const auctionEndBlockNumber: BigNumber = await basicDutchAuction.auctionEndBlockNumber();

    while ((await ethers.provider.getBlockNumber()) <= auctionEndBlockNumber.toNumber()) {
      await ethers.provider.send("evm_mine", []);
    }
    const currentPrice: BigNumber = await basicDutchAuction.getCurrentAuctionPrice();
    expect(currentPrice).to.equal(0);
    const bidValue: BigNumber = ethers.utils.parseEther("1");
    await expect(basicDutchAuction.connect(participant1).placeBid({value: bidValue})).to.be.revertedWith("Auction has concluded");
  });

});
