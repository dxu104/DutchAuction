/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type {
  BasicDutchAuction,
  BasicDutchAuctionInterface,
} from "../BasicDutchAuction";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_reservePrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_numBlocksAuctionOpen",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_offerPriceDecrement",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "winner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "AuctionEnded",
    type: "event",
  },
  {
    inputs: [],
    name: "auctionEndBlock",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionStartingPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "bidAmountsByAddress",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getBidAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initialBidAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initialBidder",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isAuctionOver",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numBlocksAuctionOpen",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "offerPriceDecrement",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "placeBid",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "receivedValidBid",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reservePrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162001523380380620015238339818101604052810190620000379190620002c8565b6200005367d96e82debd6128b360c01b6200028560201b60201c565b6200006f67c3de2e11d29bc24e60c01b6200028560201b60201c565b336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550620000cb67430d1977be11b64d60c01b6200028560201b60201c565b82600181905550620000ee67e97be9a4f0d9ef7660c01b6200028560201b60201c565b816002819055506200011167c195cdc55cb8d8ff60c01b6200028560201b60201c565b8060038190555062000134672b476f21e298d1ce60c01b6200028560201b60201c565b60035460025462000146919062000353565b6001546200015591906200039e565b60048190555062000177676708c95ae1beabba60c01b6200028560201b60201c565b600254436200018791906200039e565b600581905550620001a967f56733c3b74bf01360c01b6200028560201b60201c565b6000600660006101000a81548160ff021916908315150217905550620001e06759789c0c41ae922860c01b6200028560201b60201c565b6000600860006101000a81548160ff0219169083151502179055506200021666778b70e665937760c01b6200028560201b60201c565b6000600660016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506200027467a7d0536fa1bb058860c01b6200028560201b60201c565b6000600781905550505050620003d9565b50565b600080fd5b6000819050919050565b620002a2816200028d565b8114620002ae57600080fd5b50565b600081519050620002c28162000297565b92915050565b600080600060608486031215620002e457620002e362000288565b5b6000620002f486828701620002b1565b93505060206200030786828701620002b1565b92505060406200031a86828701620002b1565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600062000360826200028d565b91506200036d836200028d565b92508282026200037d816200028d565b9150828204841483151762000397576200039662000324565b5b5092915050565b6000620003ab826200028d565b9150620003b8836200028d565b9250828201905080821115620003d357620003d262000324565b5b92915050565b61113a80620003e96000396000f3fe6080604052600436106100e85760003560e01c80638da5cb5b1161008a578063d3642a8811610059578063d3642a88146102d6578063db2e1eed14610301578063eb91d37e1461032c578063ecfc7ecc14610357576100e8565b80638da5cb5b1461022c5780639725e6b214610257578063aceffdc614610282578063b5545a3c146102bf576100e8565b80633103ea62116100c65780633103ea62146101805780633882ce8e146101ab5780635f5ecf36146101d65780638b32778f14610201576100e8565b806305faab3e146100ed57806307d52fa81461011857806313b9b59814610143575b600080fd5b3480156100f957600080fd5b50610102610375565b60405161010f9190610d01565b60405180910390f35b34801561012457600080fd5b5061012d61037b565b60405161013a9190610d01565b60405180910390f35b34801561014f57600080fd5b5061016a60048036038101906101659190610d7f565b610381565b6040516101779190610d01565b60405180910390f35b34801561018c57600080fd5b50610195610406565b6040516101a29190610d01565b60405180910390f35b3480156101b757600080fd5b506101c061040c565b6040516101cd9190610dcd565b60405180910390f35b3480156101e257600080fd5b506101eb610432565b6040516101f89190610e03565b60405180910390f35b34801561020d57600080fd5b50610216610445565b6040516102239190610d01565b60405180910390f35b34801561023857600080fd5b5061024161044b565b60405161024e9190610dcd565b60405180910390f35b34801561026357600080fd5b5061026c61046f565b6040516102799190610e03565b60405180910390f35b34801561028e57600080fd5b506102a960048036038101906102a49190610d7f565b610482565b6040516102b69190610d01565b60405180910390f35b3480156102cb57600080fd5b506102d461049a565b005b3480156102e257600080fd5b506102eb6106b7565b6040516102f89190610d01565b60405180910390f35b34801561030d57600080fd5b506103166106bd565b6040516103239190610d01565b60405180910390f35b34801561033857600080fd5b506103416106c3565b60405161034e9190610d01565b60405180910390f35b61035f6107e7565b60405161036c9190610e03565b60405180910390f35b60075481565b60055481565b600061039767d355cbcbcbe5a02c60c01b610ce5565b6103ab67f02a933dfa46310760c01b610ce5565b6103bf67b3db7313590a8f6660c01b610ce5565b600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60025481565b600660019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600660009054906101000a900460ff1681565b60045481565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600860009054906101000a900460ff1681565b60096020528060005260406000206000915090505481565b6104ae6744890d4c1fe530ae60c01b610ce5565b6104c26713b2c5c4376f4ff660c01b610ce5565b6104d667b0abe7c3b97f7e6260c01b610ce5565b6104ea6723c06dc43ea8987c60c01b610ce5565b6000600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541161056c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161056390610e7b565b60405180910390fd5b610580670788e996ea485c3d60c01b610ce5565b61059467b5056378e9583c9360c01b610ce5565b6105a867aa986c957a5dc2c560c01b610ce5565b6000600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905061060067d1a6af018f1394ed60c01b610ce5565b6000600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506106596779a04eccf33562f860c01b610ce5565b61066d67f640d0b04381c96960c01b610ce5565b3373ffffffffffffffffffffffffffffffffffffffff166108fc829081150290604051600060405180830381858888f193505050501580156106b3573d6000803e3d6000fd5b5050565b60035481565b60015481565b60006106d96770a86ffe1fc1b45860c01b610ce5565b6106ed673a60472db2eb09ae60c01b610ce5565b61070167d8299a34a301a73c60c01b610ce5565b600554431061074f5761071e67fa3cae332194873960c01b610ce5565b6107326717cd5cd693d11de660c01b610ce5565b61074667dfccdf49b2c4b5bd60c01b610ce5565b600090506107e4565b61076367d405dad93360308f60c01b610ce5565b61077767a926a5d6a2e8305a60c01b610ce5565b61078b67ef6ed43690c7900060c01b610ce5565b60004360055461079b9190610eca565b90506107b167d52753adc648374660c01b610ce5565b6107c567bb59d6fe6914869a60c01b610ce5565b600354816107d39190610efe565b6004546107e09190610eca565b9150505b90565b60006107fd67295d3109fbaa415c60c01b610ce5565b61081167f90825364a36246f60c01b610ce5565b610825679076f85eeffd0f4960c01b610ce5565b600061082f6106c3565b9050610845670d8a0757994b683760c01b610ce5565b610859676a04dfbd363dcf5e60c01b610ce5565b61086d67e0de2f7e3ef1efa960c01b610ce5565b600660009054906101000a900460ff16156108bd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108b490610f8c565b60405180910390fd5b6108d1678408073293845e8760c01b610ce5565b6108e5674fde54871dfd789960c01b610ce5565b6108f96711306500eab6f10760c01b610ce5565b61090d676d3f70c64909063760c01b610ce5565b60003411610950576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109479061101e565b60405180910390fd5b61096467c3ceb1fa4ae57c0460c01b610ce5565b6109786757f8b430f6fdabeb60c01b610ce5565b61098c673d38bcac9a82fa7960c01b610ce5565b6109a067d032a39ab50f567360c01b610ce5565b803410156109e3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109da906110b0565b60405180910390fd5b6109f767df6b2c0e38ee4b9460c01b610ce5565b610a0b673acf3fea1825b43660c01b610ce5565b610a1f67fb052596f0febd9360c01b610ce5565b600860009054906101000a900460ff16610c3657610a476764bb41df56bd2f3d60c01b610ce5565b610a5b67168db6891b43322c60c01b610ce5565b33600660016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610ab067c0b4649678a9644b60c01b610ce5565b34600781905550610acb676024cea0b1a4311360c01b610ce5565b6001600860006101000a81548160ff021916908315150217905550610afa67c1c83de8b7296f7860c01b610ce5565b600754600960008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610b6c91906110d0565b92505081905550610b87670b88047aa3f878e060c01b610ce5565b610b9b6711f30fdcfb91708160c01b610ce5565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc6007549081150290604051600060405180830381858888f19350505050158015610c03573d6000803e3d6000fd5b50610c18679493214a534f0a0f60c01b610ce5565b610c2c67c0dad7c5f4a63e1260c01b610ce5565b6001915050610ce2565b610c4a67ad4716b14b08e9ab60c01b610ce5565b610c5e6713ccabfe995049e060c01b610ce5565b34600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610cad91906110d0565b92505081905550610cc867abcc64bf5e05b4bc60c01b610ce5565b610cdc67268eeea5bfa59b7060c01b610ce5565b60009150505b90565b50565b6000819050919050565b610cfb81610ce8565b82525050565b6000602082019050610d166000830184610cf2565b92915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610d4c82610d21565b9050919050565b610d5c81610d41565b8114610d6757600080fd5b50565b600081359050610d7981610d53565b92915050565b600060208284031215610d9557610d94610d1c565b5b6000610da384828501610d6a565b91505092915050565b6000610db782610d21565b9050919050565b610dc781610dac565b82525050565b6000602082019050610de26000830184610dbe565b92915050565b60008115159050919050565b610dfd81610de8565b82525050565b6000602082019050610e186000830184610df4565b92915050565b600082825260208201905092915050565b7f4e6f20726566756e6420617661696c61626c6500000000000000000000000000600082015250565b6000610e65601383610e1e565b9150610e7082610e2f565b602082019050919050565b60006020820190508181036000830152610e9481610e58565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610ed582610ce8565b9150610ee083610ce8565b9250828203905081811115610ef857610ef7610e9b565b5b92915050565b6000610f0982610ce8565b9150610f1483610ce8565b9250828202610f2281610ce8565b91508282048414831517610f3957610f38610e9b565b5b5092915050565b7f41756374696f6e2068617320656e646564000000000000000000000000000000600082015250565b6000610f76601183610e1e565b9150610f8182610f40565b602082019050919050565b60006020820190508181036000830152610fa581610f69565b9050919050565b7f42696420616d6f756e74206d7573742062652067726561746572207468616e2060008201527f3000000000000000000000000000000000000000000000000000000000000000602082015250565b6000611008602183610e1e565b915061101382610fac565b604082019050919050565b6000602082019050818103600083015261103781610ffb565b9050919050565b7f42696420616d6f756e74206973206c6f776572207468616e2063757272656e7460008201527f2070726963650000000000000000000000000000000000000000000000000000602082015250565b600061109a602683610e1e565b91506110a58261103e565b604082019050919050565b600060208201905081810360008301526110c98161108d565b9050919050565b60006110db82610ce8565b91506110e683610ce8565b92508282019050808211156110fe576110fd610e9b565b5b9291505056fea2646970667358221220ffcd30a46f4faeb28653db0c17bf7d4f675740b7eee9b501bb8f1bc52119927664736f6c63430008120033";

type BasicDutchAuctionConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: BasicDutchAuctionConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class BasicDutchAuction__factory extends ContractFactory {
  constructor(...args: BasicDutchAuctionConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _reservePrice: PromiseOrValue<BigNumberish>,
    _numBlocksAuctionOpen: PromiseOrValue<BigNumberish>,
    _offerPriceDecrement: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<BasicDutchAuction> {
    return super.deploy(
      _reservePrice,
      _numBlocksAuctionOpen,
      _offerPriceDecrement,
      overrides || {}
    ) as Promise<BasicDutchAuction>;
  }
  override getDeployTransaction(
    _reservePrice: PromiseOrValue<BigNumberish>,
    _numBlocksAuctionOpen: PromiseOrValue<BigNumberish>,
    _offerPriceDecrement: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _reservePrice,
      _numBlocksAuctionOpen,
      _offerPriceDecrement,
      overrides || {}
    );
  }
  override attach(address: string): BasicDutchAuction {
    return super.attach(address) as BasicDutchAuction;
  }
  override connect(signer: Signer): BasicDutchAuction__factory {
    return super.connect(signer) as BasicDutchAuction__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BasicDutchAuctionInterface {
    return new utils.Interface(_abi) as BasicDutchAuctionInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BasicDutchAuction {
    return new Contract(address, _abi, signerOrProvider) as BasicDutchAuction;
  }
}