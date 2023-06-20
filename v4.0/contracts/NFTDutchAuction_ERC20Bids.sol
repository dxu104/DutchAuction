// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract NFTDutchAuctionERC20 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    uint reservePrice;
    uint numBlocksAuctionOpen;
    uint offerPriceDecrement;
    uint intialPrice;
    uint startingBlock;
    uint public auctionCloseBlock;
    address public sellerAccountAddr;
    address payable sellerAccount;
    IERC721 public nft;
    uint nftID;
    IERC20 public tokenContract;
    bool auctionEnd;
    bool auctionStart;

    function initialize(
        address erc20TokenAddress,
        address erc721TokenAddress,
        uint256 _nftTokenId,
        uint _reservePrice,
        uint _numBlocksAuctionOpen,
        uint _offerPriceDecrement
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        nft = IERC721(erc721TokenAddress);
        nftID = _nftTokenId;
        tokenContract = IERC20(erc20TokenAddress);
        auctionEnd = false;
        auctionStart = false;
    }

    function startAuction() public {
        sellerAccountAddr = msg.sender;
        sellerAccount = payable(msg.sender);
        require(
            nft.ownerOf(nftID) == sellerAccountAddr,
            "The auction can only be initiated by the owner of the NFT."
        );
        nft.safeTransferFrom(sellerAccountAddr, address(this), nftID);
        startingBlock = block.number;
        auctionCloseBlock = startingBlock + numBlocksAuctionOpen;
        auctionStart = true;
        intialPrice =
            reservePrice +
            (offerPriceDecrement * numBlocksAuctionOpen);
    }

    function bid(uint amount) public payable {
        require(auctionStart == true, "The auction has not yet commenced!");
        require(
            auctionEnd == false && (block.number < auctionCloseBlock),
            "Bidding is closed, the auction has already concluded."
        );
        require(
            amount >= (currentPrice()),
            "The amount of your bid is under the current required auction price."
        );
        finalizeBid(amount);
    }

    function endAuctionEarly(bool _auctionEnd) public {
        auctionEnd = _auctionEnd;
    }

    function finalizeBid(uint amount) internal nftEscrowed {
        require(
            tokenContract.allowance(msg.sender, address(this)) >= amount,
            "There's not enough token allowance for this operation."
        );
        require(
            tokenContract.balanceOf(msg.sender) >= amount,
            "Your wallet balance is insufficient for this transaction."
        );
        tokenContract.transferFrom(msg.sender, sellerAccountAddr, amount);
        nft.safeTransferFrom(address(this), msg.sender, nftID);
        auctionEnd = true;
    }

    function currentPrice() internal view returns (uint) {
        uint blocksRemaining = auctionCloseBlock - block.number;
        uint currPrice = intialPrice - (blocksRemaining * offerPriceDecrement);
        return currPrice;
    }

    function cancelAuction() public nftEscrowed {
        require(
            msg.sender == sellerAccountAddr,
            "This operation is invalid, it can only be performed by the NFT owner."
        );
        require(
            auctionEnd == false,
            "The auction can't be stopped as it has already been successfully concluded."
        );
        auctionEnd = true;
        nft.safeTransferFrom(address(this), sellerAccount, nftID);
    }

    modifier nftEscrowed() {
        require(
            nft.ownerOf(nftID) == address(this),
            "The NFT for the auction is not held in escrow."
        );
        _;
    }

    function onERC721Received(
        address operator,
        address from,
        uint tokenId,
        bytes calldata data
    ) public view returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function testFinalizeBid(uint amount) public {
        finalizeBid(amount);
    }

    function _authorizeUpgrade(address newImplementation) internal override {}
}
