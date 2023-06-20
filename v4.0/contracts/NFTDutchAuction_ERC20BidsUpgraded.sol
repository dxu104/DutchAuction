// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTDutchAuction_ERC20Bids.sol";


contract NFTDutchAuction_ERC20Upgraded is 
NFTDutchAuctionERC20{

    
     function getHelloWorld() public pure returns(string memory)
    {
        return "Hello, World!";
    }
    
}


