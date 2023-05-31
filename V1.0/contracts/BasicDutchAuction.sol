// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*

BasicDutchAuction is a contract for a simple auction where the price of an item

starts high and decreases over time until a bid is placed.
*/
contract BasicDutchAuction {
// Owner of the auction
address payable public auctionCreator;

// Minimum acceptable price for the auction
uint256 public minimumAcceptablePrice;

// Duration of the auction in blocks
uint256 public auctionDurationInBlocks;

// Amount by which the price decreases per block
uint256 public priceDecrementPerBlock;

// Starting price of the auction. Calculated as minimum price plus
// the total price decrement over the duration of the auction
uint256 public startPrice;

// Block number when the auction will end. Calculated as current block
// number plus the duration of the auction in blocks
uint256 public auctionEndBlockNumber;

// Flag to indicate if the auction has ended
bool public auctionEnded;

// Address of the participant who has placed the initial valid bid
address payable public initialParticipant;

// Value of the initial valid bid
uint256 public initialBidValue;

// Flag to indicate if a valid bid has been received
bool public hasReceivedValidBid;

// Mapping to store bids by address
mapping(address => uint256) public bidsByAddress;

// Event to be emitted when the auction is completed
event AuctionCompleted(address winner, uint256 amount);

/*

The constructor sets the initial state of the auction, including

the minimum acceptable price, duration, and price decrement per block.
*/
constructor(uint256 _minimumAcceptablePrice, uint256 _auctionDurationInBlocks, uint256 _priceDecrementPerBlock) {
auctionCreator = payable(msg.sender);
minimumAcceptablePrice = _minimumAcceptablePrice;
auctionDurationInBlocks = _auctionDurationInBlocks;
priceDecrementPerBlock = _priceDecrementPerBlock;

startPrice = minimumAcceptablePrice + auctionDurationInBlocks * priceDecrementPerBlock;
auctionEndBlockNumber = block.number + auctionDurationInBlocks;
auctionEnded = false;
hasReceivedValidBid = false;
initialParticipant = payable(address(0));
initialBidValue = 0;
}

/*

placeBid allows a participant to place a bid on the auction. The function checks

that the auction is still ongoing, the bid is greater than 0 and at least as large

as the current price. If a valid bid is placed, it gets recorded.
*/
function placeBid() public payable returns(bool){
uint256 currentPrice = getCurrentAuctionPrice();

// Reverts if the auction has concluded
require(currentPrice > 0, "Auction has concluded");

// Reverts if the bid value is 0
require(msg.value > 0, "Submitted bid value must be greater than 0");

// Reverts if the bid value is less than the current price
require(msg.value >= currentPrice, "Submitted bid value is lower than the current price");

// If no valid bid has been received yet, records the current bid as the initial valid bid
if(!hasReceivedValidBid) {
initialParticipant = payable(msg.sender);
initialBidValue = msg.value;
hasReceivedValidBid = true;
bidsByAddress[auctionCreator] += initialBidValue;
auctionCreator.transfer(initialBidValue);
return true;
}

// If there is already a valid bid, simply records the new bid
bidsByAddress[msg.sender] += msg.value;
return false;
}

/*

getCurrentAuctionPrice calculates the current price of the auction.
If the auction has already ended, the current price is 0. Otherwise,
the current price is calculated as the start price minus the number
of blocks that have passed since the auction started, multiplied by the price decrement per block.
*/
function getCurrentAuctionPrice() public view returns (uint256) {
if (block.number >= auctionEndBlockNumber) {
return 0; // Auction has concluded
} else {
uint256 remainingBlocks = auctionEndBlockNumber - block.number;
return startPrice - remainingBlocks * priceDecrementPerBlock;
}
}
/*

retrieveRefund allows a participant to retrieve their bid if they have not won the auction.
*/
function retrieveRefund() external {
require(bidsByAddress[msg.sender] > 0, "No refund available for the account");

uint256 refundAmount = bidsByAddress[msg.sender];
bidsByAddress[msg.sender] = 0;
payable(msg.sender).transfer(refundAmount);
}

/*

getBalance allows to query the balance of a specific account.
*/
function getBalance(address account) external view returns (uint256) {
return bidsByAddress[account];
}
}