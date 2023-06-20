import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import "@nomiclabs/hardhat-ethers";
const { ethers,upgrades,network } = require("hardhat");
import {expect} from 'chai'
import {BigNumber, Signer} from "ethers";
import { Contract, ContractFactory } from 'ethers';
import { MyToken } from "../typechain-types/contracts/MyToken.sol";

const _reservePrice = "150";
const _numBlocksAuctionOpen = 30;
const _offerPriceDecrement = "5";
const deadline = ethers.constants.MaxUint256;

async function getPermitSignature(
  signer:any, 
  token:MyToken, 
  spender:string, 
  value:BigNumber, 
  deadline:BigNumber) {

  const [nonce, name, version, chainId] = await Promise.all([
      token.nonces(signer.address),
      token.name(),
      "1",
      signer.getChainId(),
  ])

  return ethers.utils.splitSignature(
      await signer._signTypedData(
     {  name,version,chainId,verifyingContract: token.address,},
          { Permit: [  { name: "owner", type: "address",}, { name: "spender",type: "address",},
          {name: "value", type: "uint256", }, { name: "nonce",type: "uint256",},
          { name: "deadline", type: "uint256",}, ],},
          { owner: signer.address,spender,value,nonce,deadline, }
      )
  )
}
describe("DutchAuction", function () {
  
  async function deployDutchAuctionTestFixture() 
  {
    const [owner, firstAcc, secondAcc] = await ethers.getSigners();

    const nftAuctionFactory = await ethers.getContractFactory("MyNFT");
    const nftAuctionContract = await nftAuctionFactory.deploy();
    
    await nftAuctionContract.mintNFT(firstAcc.address);

    const tokenAuctionFactory = await ethers.getContractFactory("MyToken");
    const tokenAuctionContract = await tokenAuctionFactory.deploy("1000");

    const auctionFactory = await ethers.getContractFactory("NFTDutchAuctionERC20");
    const auctionContract = await upgrades.deployProxy(auctionFactory, [tokenAuctionContract.address, nftAuctionContract.address, 1, ethers.utils.parseUnits(_reservePrice, 18), _numBlocksAuctionOpen, ethers.utils.parseUnits(_offerPriceDecrement, 18)], {kind: 'uups'});

    await nftAuctionContract.connect(firstAcc).approve(auctionContract.address, 1);
    
    return { nftAuctionContract, tokenAuctionContract, auctionContract, owner, firstAcc, secondAcc };
  }

  describe("Deployment", function () 
  {
    let NFTDutchAuctionERC20: ContractFactory, auctionContract: Contract, MyToken: ContractFactory, tokenContract: Contract, MyNFT: ContractFactory, nftContract: Contract, owner: Signer, addr1: Signer, addr2: Signer;

    beforeEach(async function() {
      NFTDutchAuctionERC20 = await ethers.getContractFactory('NFTDutchAuctionERC20');
      MyToken = await ethers.getContractFactory('MyToken');
      MyNFT = await ethers.getContractFactory('MyNFT');
  
      [owner, addr1, addr2] = await ethers.getSigners();
  
      // Deploy tokenContract with total supply of 1000
      tokenContract = await MyToken.deploy(1000);
      await tokenContract.deployed();
  
      // Transfer 150 tokens to addr1
      await tokenContract.connect(owner).transfer(await addr1.getAddress(), ethers.utils.parseUnits('150'));
  
      nftContract = await MyNFT.deploy();
      await nftContract.deployed();
  
      // Mint NFT to addr1
      await nftContract.connect(addr1).mintNFT(await addr1.getAddress());
  
      // Deploy auctionContract without any parameters
      auctionContract = await NFTDutchAuctionERC20.deploy();
      await auctionContract.deployed();
  
      // Call initialize function on the deployed contract
      await auctionContract.initialize(
        tokenContract.address, 
        nftContract.address, 
        1, 
        ethers.utils.parseUnits('150'), 
        10, 
        ethers.utils.parseUnits('10')
      );
  });
    it('Should fail when NFT is not escrowed', async function() {
      // Approve the token for the auction contract
      await tokenContract.connect(addr1).approve(auctionContract.address, 30);

      // Generate empty bytes32 strings
      let emptyBytes32 = ethers.utils.formatBytes32String('');

      // Trying to finalize the bid without escrowing the NFT
      await expect(
          auctionContract.connect(addr1).bid(30, true, 0, emptyBytes32, emptyBytes32, Date.now() + 3600)
      ).to.be.revertedWith('Bids are not being accepted, the auction has ended.');
  });
    
    it("Validate that calling the initializer more than once results in a failure.", async function () {
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

      it("Check if the NFT is properly held in the auction contract's escrow.", async function () 
      {
        const { nftAuctionContract, auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        
        const contractBalancePre = await nftAuctionContract.balanceOf(auctionContract.address);
        await auctionContract.connect(firstAcc).escrowNFT();
        const contractBalancePost = await nftAuctionContract.balanceOf(auctionContract.address);
        
        expect(contractBalancePre).to.equal(contractBalancePost.sub(ethers.BigNumber.from("1")));
      });

      it("Ascertain that the NFT is successfully removed from the seller's wallet.", async function () 
      {
        const { nftAuctionContract, auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        
        const ownerBalancePre = await nftAuctionContract.balanceOf(firstAcc.address);
        await auctionContract.connect(firstAcc).escrowNFT();
        const ownerBalancePost = await nftAuctionContract.balanceOf(firstAcc.address);

        expect(ownerBalancePre).to.equal(ownerBalancePost.add(ethers.BigNumber.from("1")));
      });

      it("Evaluate if the NFT is correctly transferred to the bidder's wallet when the top bid is accepted.", async function () 
      {
        const { nftAuctionContract, tokenAuctionContract, owner, auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
    
        const { v, r, s } = await getPermitSignature(
            owner,
            tokenAuctionContract,
            auctionContract.address,
            ethers.utils.parseUnits("200", 18),
            deadline
        );

        await auctionContract.connect(firstAcc).escrowNFT();
        const buyerBalancePre = await nftAuctionContract.balanceOf(owner.address);
        await auctionContract.connect(owner).bid(ethers.utils.parseUnits("200", 18), true, v, r, s, deadline);
        const buyerBalancePost = await nftAuctionContract.balanceOf(owner.address);

        expect(buyerBalancePost).to.equal(buyerBalancePre.add(ethers.BigNumber.from("1")));
      });

      it("Verify that the seller's wallet receives the ERC20 tokens when the auction is successfully completed.", async function () 
      {
        const { auctionContract, tokenAuctionContract, owner, firstAcc, secondAcc } = await loadFixture(deployDutchAuctionTestFixture);

        const { v, r, s } = await getPermitSignature(
          owner,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("300", 18),
          deadline
      );

        await auctionContract.connect(firstAcc).escrowNFT();
        let sellerBalancePre = await tokenAuctionContract.balanceOf(firstAcc.address);
        await auctionContract.connect(owner).bid(ethers.utils.parseUnits("300", 18), true, v, r, s, deadline);
        let sellerBalancePost = await tokenAuctionContract.balanceOf(firstAcc.address);

        expect(sellerBalancePost).to.equal(sellerBalancePre.add(ethers.utils.parseUnits("300", 18)));
      });

      it("Ensure the ERC20 tokens are withdrawn from the bidder's wallet upon a successful auction completion.", async function () 
      {
        const { auctionContract, tokenAuctionContract, owner, firstAcc, secondAcc } = await loadFixture(deployDutchAuctionTestFixture);

        const { v, r, s } = await getPermitSignature(
          owner,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("300", 18),
          deadline
      );

        await auctionContract.connect(firstAcc).escrowNFT();
        let sellerBalancePre = await tokenAuctionContract.balanceOf(owner.address);
        await auctionContract.connect(owner).bid(ethers.utils.parseUnits("300", 18), true, v, r, s, deadline);
        let sellerBalancePost = await tokenAuctionContract.balanceOf(owner.address);

        expect(sellerBalancePost).to.equal(sellerBalancePre.sub(ethers.utils.parseUnits("300", 18)));
      });

      it("Confirm that in case of an auction failure, the NFT is correctly returned to the seller's wallet.", async function () 
      {
        const { nftAuctionContract, auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        
        await auctionContract.connect(firstAcc).escrowNFT();
        const sellerBalancePre = await nftAuctionContract.balanceOf(firstAcc.address);
        await network.provider.send("hardhat_mine", ["0x100"]);
        await auctionContract.connect(firstAcc).endAuction();
        const sellerBalancePost = await nftAuctionContract.balanceOf(firstAcc.address);

        expect(sellerBalancePre).to.equal(sellerBalancePost.sub(ethers.BigNumber.from("1")));
      });

      it("Make sure that only the NFT owner has the permission to execute the (endAuction) function.", async function () 
      {
        const { auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();

        await expect(auctionContract.endAuction()).revertedWith("Invalid call, Only owner of this NFT can trigger this call.");
      });

      it("Establish if the auction's initiator possesses the auction NFT.", async function () 
      {
        const { auctionContract } = await loadFixture(deployDutchAuctionTestFixture);

        await expect(auctionContract.escrowNFT()).revertedWith("Only owner of the NFT can start the auction.");
      });

      it("Check that the auction does not accept further bids from the winning bidder once a bid is accepted.", async function () 
      {
        const { auctionContract, tokenAuctionContract, owner, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);

        const { v, r, s } = await getPermitSignature(
          owner,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("160", 18),
          deadline
      );

        await auctionContract.connect(firstAcc).escrowNFT();
        await auctionContract.connect(owner).bid(ethers.utils.parseUnits("160", 18), true, v, r, s, deadline);
  
        await expect(auctionContract.connect(owner).bid(ethers.utils.parseUnits("160", 18), true, v, r, s, deadline)).revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Validate that the auction does not entertain additional bids from participants other than the winning bidder once a bid is endorsed.", async function () 
      {
        const { auctionContract, firstAcc, owner, tokenAuctionContract } = await loadFixture(deployDutchAuctionTestFixture);

        const { v, r, s } = await getPermitSignature(
          owner,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("160", 18),
          deadline
       );

        await auctionContract.connect(firstAcc).escrowNFT();
        await auctionContract.bid(ethers.utils.parseUnits("160", 18), true, v, r, s, deadline);
  
        await expect(auctionContract.connect(firstAcc).bid(ethers.utils.parseUnits("160", 18), true, v, r, s, deadline)).revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Make certain that the auction ceases to consider bids when the auction's designated closing time (block) has passed.", async function () 
      {
        const { auctionContract, firstAcc, owner, tokenAuctionContract } = await loadFixture(deployDutchAuctionTestFixture);

        const { v, r, s } = await getPermitSignature(
          owner,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("160", 18),
          deadline
       );

        await auctionContract.connect(firstAcc).escrowNFT();
        await network.provider.send("hardhat_mine", ["0x100"]);
        
        await expect(auctionContract.bid(ethers.utils.parseUnits("160", 18), true, v, r, s, deadline)).to.be.revertedWith("Bids are not being accepted, the auction has ended.");
      });
      

      it("Ascertain that bids offered below the auction's minimum price are rightly rejected.", async function () 
      {
        const { auctionContract, owner, firstAcc, tokenAuctionContract } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();

        const { v, r, s } = await getPermitSignature(
          owner,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("30", 18),
          deadline
       );

        await expect(auctionContract.connect(owner).bid(ethers.utils.parseUnits("30", 18), true, v, r, s, deadline)).revertedWith("Your bid price is less than the required auction price.");
      });

      it("Confirm that a bidder's transaction is refused if the off-chain transaction's signature differs.", async function () 
      {
        const { auctionContract, owner, firstAcc, tokenAuctionContract } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();
        const { v, r, s } = await getPermitSignature(
          firstAcc,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("1100", 18),
          deadline
       );
  
        await expect(auctionContract.connect(owner).bid(ethers.utils.parseUnits("1100", 18), true, v, r, s, deadline)).revertedWith("ERC20Permit: invalid signature");
      });

      it("Ensure that a bidder's transaction is rejected if there is a deficit of balance.", async function () 
      {
        const { auctionContract, owner, firstAcc, tokenAuctionContract } = await loadFixture(deployDutchAuctionTestFixture);
        const { v, r, s } = await getPermitSignature(
          owner,
          tokenAuctionContract,
          auctionContract.address,
          ethers.utils.parseUnits("1005", 18),
          deadline
       );

        await auctionContract.connect(firstAcc).escrowNFT();
  
        await expect(auctionContract.connect(owner).bid(ethers.utils.parseUnits("1005", 18) , true, v, r, s, deadline)).revertedWith("Not enough balance in the wallet.");
      });
      

      it("Verify that the NFT is properly secured in the escrow of the auction smart contract.", async function () 
      {
        const { auctionContract, owner, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
  
        await expect(auctionContract.connect(owner).endAuction()).revertedWith("Auction NFT is not escrowed.");
      });
  });

  describe("Upgradable", () => 
  {
    it("Checking if the contract is successfully upgraded", async () => 
    {
      const { auctionContract } = await loadFixture(deployDutchAuctionTestFixture);
      const auctionContractUpgrade = await ethers.getContractFactory("NFTDutchAuction_ERC20Upgraded");
      const auctionContractUpgradeDeploy = await upgrades.upgradeProxy(auctionContract.address, auctionContractUpgrade);

      expect(await auctionContractUpgradeDeploy.currentVersion()).to.equal(ethers.BigNumber.from("2"))
    });

  });
  
  describe("Auction Contract", function() {
    it("Should finalize bid correctly", async function() {
      const [deployer] = await ethers.getSigners();
  
      const initialSupply = ethers.utils.parseEther("1000000");
      const ERC20 = await ethers.getContractFactory("MyToken");
      const erc20 = await ERC20.connect(deployer).deploy(initialSupply);
      await erc20.deployed();
  
      const ERC721 = await ethers.getContractFactory("MyNFT");
      const erc721 = await ERC721.connect(deployer).deploy();
      await erc721.deployed();
  
      const Auction = await ethers.getContractFactory("NFTDutchAuctionERC20");
      const auction = await Auction.connect(deployer).deploy();
      await auction.deployed();
  
      const _nftTokenId = 1;
      const _reservePrice = ethers.utils.parseEther("1");
      const _numBlocksAuctionOpen = 150;
      const _offerPriceDecrement = ethers.utils.parseEther("0.01");
  
      await auction.initialize(erc20.address, erc721.address, _nftTokenId, _reservePrice, _numBlocksAuctionOpen, _offerPriceDecrement);
  
      await erc721.connect(deployer).mintNFT(deployer.address);
      await erc721.connect(deployer).approve(auction.address, _nftTokenId);
      await auction.escrowNFT();
      expect(await erc721.ownerOf(_nftTokenId)).to.equal(auction.address); 
  
      const tokenAmount = ethers.utils.parseEther("10");
      await erc20.approve(auction.address, tokenAmount);
  
      const amount = ethers.utils.parseEther("10");
      const isOffChain = false;
      const v = 27; // or 28
      const r = ethers.utils.randomBytes(32);
      const s = ethers.utils.randomBytes(32);
      const deadline = Math.floor(new Date().getTime() / 1000) + 600;
  
      await auction.bid(amount, isOffChain, v, r, s, deadline);
  
      if (await erc721.ownerOf(_nftTokenId) !== auction.address) {
        console.log('The auction has ended.');
      } else {
        for(let i = 0; i < _numBlocksAuctionOpen; i++){
          await ethers.provider.send("evm_mine");  // this will advance one block
        }
        
        const currentBlock = await ethers.provider.getBlockNumber();
        const auctionCloseBlock = await auction.auctionCloseBlock();
  
        if (currentBlock >= auctionCloseBlock) {
          await auction.endAuction();
          expect(await erc721.ownerOf(_nftTokenId)).to.not.equal(auction.address);  // Assert NFT is no longer escrowed in the auction contract
        } else {
          console.log('The auction is not over yet.');
        }
      }
    });
  });
  
});