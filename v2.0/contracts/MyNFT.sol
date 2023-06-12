// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
//定义 MyNFT 合约，它继承自 ERC721URIStorage 和 Ownable。这样，MyNFT 合约就包含了 ERC721 的功能（例如创建、转移代币等）和 Ownable 的功能（例如限制只有合约所有者才能执行某些操作）。
// 创建自己的 NFT 合约，继承自 ERC721URIStorage（用于保存 token 的 URI）和 Ownable（代表合约所有者）
contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;  // 声明一个 Counters.Counter 类型的私有变量 _tokenIds，用于产生唯一的 token ID。

    constructor() ERC721("MyNFT", "DCNFT") {}  // 构造函数在合约创建时执行。在这里，它调用了 ERC721 的构造函数，设置了代币的名字 "MyNFT" 和符号 "DCNFT"

    // 创建 NFT 的函数，只有合约的所有者才能创建.这是一个公共函数，但只有合约的所有者可以调用（因为有 onlyOwner 修饰符）。这个函数接收两个参数，一个是代币接收者的地址，一个是代币的 URI。函数首先获取当前的 token ID，然后创建一个新的 token 并将其分配给接收者，同时设置这个 token 的 URI。最后，递增 token ID，并返回新创建的 token ID。
    function mintNFT(
        address receiver,  // 接收者地址
        string memory tokenURI  // NFT 的元数据 URI
    ) public onlyOwner returns (uint256) {
        uint256 newTokenId = _tokenIds.current();  // 获取当前的 tokenId
        _mint(receiver, newTokenId);  // 将新创建的 token 分配给接收者
        _setTokenURI(newTokenId, tokenURI);  // 设置 token 的 URI

        _tokenIds.increment();  // 递增 tokenId
        return newTokenId;
    }
}
