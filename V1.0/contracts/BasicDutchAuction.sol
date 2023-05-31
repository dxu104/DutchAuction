// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BasicDutchAuction {
    address payable public owner;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public auctionStartingPrice;
    uint256 public auctionEndBlock;
    bool public isAuctionOver;
    address payable public initialBidder;
    uint256 public initialBidAmount;
    bool public receivedValidBid;

    mapping(address => uint256) public bidAmountsByAddress;

    event AuctionEnded(address winner, uint256 amount);

    constructor(uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        owner = payable(msg.sender);
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;

        auctionStartingPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
        auctionEndBlock = block.number + numBlocksAuctionOpen;
        isAuctionOver = false;
        receivedValidBid = false;
        initialBidder = payable(address(0));
        initialBidAmount = 0;
    }

    function placeBid() public payable returns (bool) {
        uint256 currentPrice = getCurrentPrice();
        require(!isAuctionOver, "Auction has ended");
        require(msg.value > 0, "Bid amount must be greater than 0");
        require(msg.value >= currentPrice, "Bid amount is lower than current price");

        if (!receivedValidBid) {
            initialBidder = payable(msg.sender);
            initialBidAmount = msg.value;
            receivedValidBid = true;
            bidAmountsByAddress[owner] += initialBidAmount;
            owner.transfer(initialBidAmount);
            return true;
        }
        bidAmountsByAddress[msg.sender] += msg.value;
        return false;
    }

    function getCurrentPrice() public view returns (uint256) {
        if (block.number >= auctionEndBlock) {
            return 0; // Auction has ended
        } else {
            uint256 blocksRemaining = auctionEndBlock - block.number;
            return auctionStartingPrice - blocksRemaining * offerPriceDecrement;
        }
    }

    function claimRefund() external {
        require(bidAmountsByAddress[msg.sender] > 0, "No refund available");

        uint256 refundAmount = bidAmountsByAddress[msg.sender];
        bidAmountsByAddress[msg.sender] = 0;
        payable(msg.sender).transfer(refundAmount);
    }

    function getBidAmount(address account) external view returns (uint256) {
        return bidAmountsByAddress[account];
    }
}
