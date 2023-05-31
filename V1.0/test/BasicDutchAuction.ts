// Import the libraries required for this test
import { ethers } from 'hardhat'; // Interact with Ethereum
import { BigNumber } from 'ethers'; // Manipulate large numbers
import { expect } from 'chai'; // Assertion library
import { Signer } from "ethers"; // Ethereum account abstraction
import { BasicDutchAuction } from '../typechain-types/BasicDutchAuction'; // TypeScript type for the contract

// Test suite for the BasicDutchAuction contract
describe('BasicDutchAuction', () => {
  // Define variables to be used in the tests
  let basicDutchAuction: BasicDutchAuction; // Contract instance
  let owner: Signer; // Contract owner
  let participant1: Signer; // Auction participant
  let participant2: Signer; // Another auction participant
  const minimumAcceptablePrice: number = 5000; // Lowest acceptable auction price
  const auctionDurationInBlocks: number = 20; // Auction duration in blocks
  const priceDecrementPerBlock: number = 500; // Price decrement per block
  const bidValue1: BigNumber = ethers.utils.parseEther("100"); // First bid value

  // Hook executed before each test
  beforeEach(async () => {
    // Get signers (represents different Ethereum accounts)
    [owner, participant1, participant2] = await ethers.getSigners();

    // Create a contract factory
    const BasicDutchAuctionFactory = await ethers.getContractFactory('BasicDutchAuction');

    // Deploy a new contract using the factory and store its instance
    basicDutchAuction = await BasicDutchAuctionFactory.deploy(
      minimumAcceptablePrice,
      auctionDurationInBlocks,
      priceDecrementPerBlock
    ) as BasicDutchAuction;
  });

  // Test case: contract should initialize correctly
  it('should initialize contract variables correctly', async () => {
    // Check auction creator
    expect(await basicDutchAuction.auctionCreator()).to.equal(await owner.getAddress());

    // Check minimum acceptable price
    expect(await basicDutchAuction.minimumAcceptablePrice()).to.equal(minimumAcceptablePrice);

    // Check auction duration in blocks
    expect(await basicDutchAuction.auctionDurationInBlocks()).to.equal(auctionDurationInBlocks);

    // Check price decrement per block
    expect(await basicDutchAuction.priceDecrementPerBlock()).to.equal(priceDecrementPerBlock);
  });

  // Test case: initial participant should be able to place bid
  it('should allow the initial participant to place bid and forward it to the auction creator', async function() {
    // Create a bid value
    const bidValue1: BigNumber = ethers.utils.parseEther("100");

    // Place a bid as participant1
    await basicDutchAuction.connect(participant1).placeBid({ value: bidValue1 });

    // Check initial participant
    expect(await basicDutchAuction.initialParticipant()).to.equal(await participant1.getAddress());

    // Check initial bid value
    expect(await basicDutchAuction.initialBidValue()).to.equal(bidValue1);

    // Check that the bid was forwarded to the owner
    expect(await basicDutchAuction.getBalance(await owner.getAddress())).to.equal(bidValue1);
  });

  // Test case: retrieving a non-existing refund should fail
  it("should fail if there's no refund to retrieve", async function() {
    // Try to retrieve a refund and expect it to fail
    await expect(basicDutchAuction.connect(participant1).retrieveRefund()).to.be.revertedWith("No refund available for the account");
  });

  // Test case: placing a bid below the ongoing price should fail
  it("should fail if the bid is less than the ongoing auction price", async function() {
    // Get current price and subtract 1
    const currentPrice: BigNumber = (await basicDutchAuction.getCurrentAuctionPrice()).sub(1);

    // Try to place a bid below the current price and expect it to fail
    await expect(basicDutchAuction.connect(participant1).placeBid({value: currentPrice})).to.be.revertedWith("Submitted bid value is lower than the current price");
  });

  // Test case: placing a bid of zero should fail
  it("should fail if the bid is less than zero", async function() {
    // Create a zero bid value
    const bidValue: BigNumber = ethers.utils.parseEther("0");

    // Try to place a zero bid and expect it to fail
    await expect(basicDutchAuction.connect(participant1).placeBid({value: bidValue})).to.be.revertedWith("Submitted bid value must be greater than 0");
  });

  // Test case: bids after winner's bid should be reimbursed and no further bids accepted
  it("should reimburse bids following the winner's bid and stop accepting further bids", async function() {
    // Create bid values
    const bidValue1: BigNumber = ethers.utils.parseEther("400");
    const bidValue2: BigNumber = ethers.utils.parseEther("300");

    // Check if a valid bid has been received (should return false)
    expect(await basicDutchAuction.hasReceivedValidBid()).to.be.false;

    // Place bid as participant2
    await basicDutchAuction.connect(participant2).placeBid({ value: bidValue2 });

    // Check if a valid bid has been received (should return true)
    expect(await basicDutchAuction.hasReceivedValidBid()).to.be.true;

    // Place a bid as participant1
    await basicDutchAuction.connect(participant1).placeBid({ value: bidValue1 });

    // Get the participant1 balance before claiming the refund
    const amountbeforeClaim: BigNumber = await basicDutchAuction.getBalance(await participant1.getAddress());

    // Claim the refund for participant1
    await basicDutchAuction.connect(participant1).retrieveRefund();

    // Get the participant1 balance after claiming the refund
    const amountafterClaim: BigNumber = await basicDutchAuction.getBalance(await participant1.getAddress());

    // Calculate the difference in balance (should be equal to the bid)
    const difference: BigNumber = amountbeforeClaim.sub(amountafterClaim);
    expect(difference).to.equal(bidValue1);
  });

  // Test case: when the number of blocks surpasses the auction's end time, the auction price should be zero
  it("should return zero when the number of blocks surpasses the auction's end time", async () => {
    // Get the auction end block number
    const auctionEndBlockNumber: BigNumber = await basicDutchAuction.auctionEndBlockNumber();

    // Mine blocks until the auction end block number
    while ((await ethers.provider.getBlockNumber()) <= auctionEndBlockNumber.toNumber()) {
      await ethers.provider.send("evm_mine", []);
    }

    // Get the current price (should be zero)
    const currentPrice: BigNumber = await basicDutchAuction.getCurrentAuctionPrice();
    expect(currentPrice).to.equal(0);

    // Try to place a bid and expect it to fail (auction has ended)
    const bidValue: BigNumber = ethers.utils.parseEther("1");
    await expect(basicDutchAuction.connect(participant1).placeBid({value: bidValue})).to.be.revertedWith("Auction has concluded");
  });
});
