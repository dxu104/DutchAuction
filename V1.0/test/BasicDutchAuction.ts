import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

import { expect } from 'chai';
import { Signer } from "ethers";
import { BasicDutchAuction } from '../typechain-types/BasicDutchAuction';

describe('BasicDutchAuction', () => {
    let basicDutchAuction: BasicDutchAuction;
    let owner: Signer;
    let bidder1: Signer;
    let bidder2: Signer;

    const reservePrice: number = 5000;
    const numBlocksAuctionOpen: number = 20;
    const offerPriceDecrement: number = 500;
    const bidAmount1: BigNumber = ethers.utils.parseEther("1.5");

    beforeEach(async () => {
        [owner, bidder1, bidder2] = await ethers.getSigners();
        const BasicDutchAuctionFactory = await ethers.getContractFactory('BasicDutchAuction');
        basicDutchAuction = await BasicDutchAuctionFactory.deploy(
            reservePrice,
            numBlocksAuctionOpen,
            offerPriceDecrement
        ) as BasicDutchAuction;
    });

    it('should set up contract variables as expected', async () => {
        expect(await basicDutchAuction.owner()).to.equal(await owner.getAddress());
        expect(await basicDutchAuction.reservePrice()).to.equal(reservePrice);
        expect(await basicDutchAuction.numBlocksAuctionOpen()).to.equal(numBlocksAuctionOpen);
        expect(await basicDutchAuction.offerPriceDecrement()).to.equal(offerPriceDecrement);
    });

    it('should let the initial bidder place a bid and forward it to the owner at once', async function () {
        const bidAmount1: BigNumber = ethers.utils.parseEther("1.5");
        await basicDutchAuction.connect(bidder1).placeBid({ value: bidAmount1 });
        expect(await basicDutchAuction.initialBidder()).to.equal(await bidder1.getAddress());
        expect(await basicDutchAuction.initialBidAmount()).to.equal(bidAmount1);
        expect(await basicDutchAuction.getBidAmount(await owner.getAddress())).to.equal(bidAmount1);
    });

    it("should fail if there's no refund to claim", async function () {
        await expect(basicDutchAuction.connect(bidder1).claimRefund()).to.be.revertedWith("No refund available");
    });

    it("should fail if the bid is less than the ongoing price", async function () {
        const currentPrice: BigNumber = (await basicDutchAuction.getCurrentPrice()).sub(1);
        await expect(basicDutchAuction.connect(bidder1).placeBid({ value: currentPrice })).to.be.revertedWith(
            "Bid amount is lower than current price"
        );
    });

    it("should fail if the bid is less than zero", async function () {
        const bidAmount: BigNumber = ethers.utils.parseEther("0");
        await expect(basicDutchAuction.connect(bidder1).placeBid({ value: bidAmount })).to.be.revertedWith(
            "Bid amount must be greater than 0"
        );
    });

    it("should reimburse subsequent bids and cease accepting bids following the winner's bid", async function () {
        const bidAmount1: BigNumber = ethers.utils.parseEther("400");
        const bidAmount2: BigNumber = ethers.utils.parseEther("200");
        expect(await basicDutchAuction.receivedValidBid()).to.be.false;
        await basicDutchAuction.connect(bidder2).placeBid({ value: bidAmount2 });
        expect(await basicDutchAuction.receivedValidBid()).to.be.true;
        await basicDutchAuction.connect(bidder1).placeBid({ value: bidAmount1 });
        const amountBeforeClaim: BigNumber = await basicDutchAuction.getBidAmount(await bidder1.getAddress());
        await basicDutchAuction.connect(bidder1).claimRefund();
        const amountAfterClaim: BigNumber = await basicDutchAuction.getBidAmount(await bidder1.getAddress());
        const difference: BigNumber = amountBeforeClaim.sub(amountAfterClaim);
        expect(difference).to.equal(bidAmount1);
    });

    it("should yield zero when the number of blocks surpasses the auction's end time", async () => {
        const auctionEndBlock: BigNumber = await basicDutchAuction.auctionEndBlock();

        while ((await ethers.provider.getBlockNumber()) <= auctionEndBlock.toNumber()) {
            await ethers.provider.send("evm_mine", []);
        }
        const currentPrice: BigNumber = await basicDutchAuction.getCurrentPrice();
        expect(currentPrice).to.equal(0);
        const bidAmount: BigNumber = ethers.utils.parseEther("1");
        await expect(basicDutchAuction.connect(bidder1).placeBid({ value: bidAmount })).to.be.revertedWith("Auction has ended");
    });
});
