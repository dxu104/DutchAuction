
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC721.sol";

// 创建 NFT 的荷兰式拍卖合约
contract NFTDutchAuction {
    address payable public immutable owner;  // 拍卖合约的所有者

    address public immutable erc721TokenAddress;  // NFT 合约地址
    uint256 public immutable nftTokenId;  // 被拍卖的 NFT 的 tokenId
    uint256 public immutable reservePrice;  // 底价
    uint256 public immutable numBlocksAuctionOpen;  // 拍卖开放的区块数
    uint256 public immutable offerPriceDecrement;  // 每个区块价格降低的数量

    IERC721 internal immutable nft;  // ERC721 接口实例
    uint256 public immutable startBlock;  // 拍卖开始的区块号
    uint256 public immutable initialPrice;  // 初始价格
    address public winner;  // 拍卖的赢家

    constructor(
        address _erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        owner = payable(msg.sender);  // 初始化合约所有者为合约的部署者

        erc721TokenAddress = _erc721TokenAddress;  // 设置 NFT 合约地址
        nftTokenId = _nftTokenId;  // 设置被拍卖的 NFT 的 tokenId
        reservePrice = _reservePrice;  // 设置底价
        numBlocksAuctionOpen = _numBlocksAuctionOpen;  // 设置拍卖开放的区块数
        offerPriceDecrement = _offerPriceDecrement;  // 设置每个区块价格降低的数量

        nft = IERC721(_erc721TokenAddress);  // 创建 ERC721 接口实例

        // 检查拍卖的 NFT 是否属于拍卖合约的所有者
        require(
            nft.ownerOf(_nftTokenId) == owner,
            "The NFT tokenId does not belong to the Auction's Owner"
        );

        startBlock = block.number;  // 设置拍卖开始的区块号
        initialPrice =
            reservePrice +
            (numBlocksAuctionOpen * offerPriceDecrement);  // 计算初始价格
    }

    // 获取当前的拍卖价格
    function getCurrentPrice() public view returns (uint256) {
        uint256 blocksElapsed = block.number - startBlock;  // 计算已经过去的区块数
        if (blocksElapsed >= numBlocksAuctionOpen) {
            return reservePrice;  // 如果已经超过拍卖开放的区块数，则返回底价
        } else {
            return initialPrice - (blocksElapsed * offerPriceDecrement);  // 否则，返回当前价格
        }
    }

    // 出价
    function placeBid() external payable returns (address) {
       // require(winner == address(0), "Auction has already concluded");  // 检查拍卖是否已经结束

        require(
            (block.number - startBlock) <= numBlocksAuctionOpen,
            "Auction expired"  // 检查拍卖是否已经过期
        );

        uint256 currentPrice = getCurrentPrice();  // 获取当前价格
        require(
            msg.value >= currentPrice,
            "The wei value sent is not acceptable"  // 检查出价是否大于等于当前价格
        );

        winner = msg.sender;  // 设置赢家
        owner.transfer(msg.value);  // 将出价转给合约所有者
        nft.transferFrom(owner, winner, nftTokenId);  // 将 NFT 转给赢家

        return winner;
    }
}   
