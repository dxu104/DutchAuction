import React, { useState } from 'react';
import contractAbi from "../contract/BasicDutchAuction.json";
import { ethers } from 'ethers';

const contractBytecode = "0x60806040523480156200001157600080fd5b5060405162000fca38038062000fca833981810160405281019062000037919062000192565b336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508260018190555081600281905550806003819055506003546002546200009e91906200021d565b600154620000ad919062000268565b60048190555060025443620000c3919062000268565b6005819055506000600660006101000a81548160ff0219169083151502179055506000600860006101000a81548160ff0219169083151502179055506000600660016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600781905550505050620002a3565b600080fd5b6000819050919050565b6200016c8162000157565b81146200017857600080fd5b50565b6000815190506200018c8162000161565b92915050565b600080600060608486031215620001ae57620001ad62000152565b5b6000620001be868287016200017b565b9350506020620001d1868287016200017b565b9250506040620001e4868287016200017b565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006200022a8262000157565b9150620002378362000157565b9250828202620002478162000157565b91508282048414831517620002615762000260620001ee565b5b5092915050565b6000620002758262000157565b9150620002828362000157565b92508282019050808211156200029d576200029c620001ee565b5b92915050565b610d1780620002b36000396000f3fe6080604052600436106100e85760003560e01c8063cbd330eb1161008a578063ef76347911610059578063ef763479146102b7578063f1a9af89146102e2578063f5abdb621461030d578063f8b2cb4f14610338576100e8565b8063cbd330eb14610206578063e0cd584b14610243578063e99b75ad1461026e578063ecfc7ecc14610299576100e8565b806354ddd5d6116100c657806354ddd5d61461016e578063677f8c141461018557806386433374146101b0578063bf41ab3f146101db576100e8565b80630b738946146100ed5780634e0aa4121461011857806351c7115b14610143575b600080fd5b3480156100f957600080fd5b50610102610375565b60405161010f91906108b8565b60405180910390f35b34801561012457600080fd5b5061012d61037b565b60405161013a91906108b8565b60405180910390f35b34801561014f57600080fd5b50610158610381565b60405161016591906108b8565b60405180910390f35b34801561017a57600080fd5b506101836103c9565b005b34801561019157600080fd5b5061019a61051e565b6040516101a79190610914565b60405180910390f35b3480156101bc57600080fd5b506101c5610542565b6040516101d2919061094a565b60405180910390f35b3480156101e757600080fd5b506101f0610555565b6040516101fd91906108b8565b60405180910390f35b34801561021257600080fd5b5061022d600480360381019061022891906109a8565b61055b565b60405161023a91906108b8565b60405180910390f35b34801561024f57600080fd5b50610258610573565b60405161026591906108b8565b60405180910390f35b34801561027a57600080fd5b50610283610579565b6040516102909190610914565b60405180910390f35b6102a161059f565b6040516102ae919061094a565b60405180910390f35b3480156102c357600080fd5b506102cc610837565b6040516102d991906108b8565b60405180910390f35b3480156102ee57600080fd5b506102f761083d565b60405161030491906108b8565b60405180910390f35b34801561031957600080fd5b50610322610843565b60405161032f919061094a565b60405180910390f35b34801561034457600080fd5b5061035f600480360381019061035a91906109a8565b610856565b60405161036c91906108b8565b60405180910390f35b60055481565b60035481565b6000600554431061039557600090506103c6565b6000436005546103a59190610a04565b9050600354816103b59190610a38565b6004546103c29190610a04565b9150505b90565b6000600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541161044b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161044290610afd565b60405180910390fd5b6000600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055503373ffffffffffffffffffffffffffffffffffffffff166108fc829081150290604051600060405180830381858888f1935050505015801561051a573d6000803e3d6000fd5b5050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600660009054906101000a900460ff1681565b60015481565b60096020528060005260406000206000915090505481565b60075481565b600660019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000806105aa610381565b9050600081116105ef576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105e690610b69565b60405180910390fd5b60003411610632576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161062990610bfb565b60405180910390fd5b80341015610675576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161066c90610c8d565b60405180910390fd5b600860009054906101000a900460ff166107d85733600660016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550346007819055506001600860006101000a81548160ff021916908315150217905550600754600960008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461075e9190610cad565b9250508190555060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc6007549081150290604051600060405180830381858888f193505050501580156107cd573d6000803e3d6000fd5b506001915050610834565b34600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546108279190610cad565b9250508190555060009150505b90565b60025481565b60045481565b600860009054906101000a900460ff1681565b6000600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6000819050919050565b6108b28161089f565b82525050565b60006020820190506108cd60008301846108a9565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006108fe826108d3565b9050919050565b61090e816108f3565b82525050565b60006020820190506109296000830184610905565b92915050565b60008115159050919050565b6109448161092f565b82525050565b600060208201905061095f600083018461093b565b92915050565b600080fd5b6000610975826108d3565b9050919050565b6109858161096a565b811461099057600080fd5b50565b6000813590506109a28161097c565b92915050565b6000602082840312156109be576109bd610965565b5b60006109cc84828501610993565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610a0f8261089f565b9150610a1a8361089f565b9250828203905081811115610a3257610a316109d5565b5b92915050565b6000610a438261089f565b9150610a4e8361089f565b9250828202610a5c8161089f565b91508282048414831517610a7357610a726109d5565b5b5092915050565b600082825260208201905092915050565b7f4e6f20726566756e6420617661696c61626c6520666f7220746865206163636f60008201527f756e740000000000000000000000000000000000000000000000000000000000602082015250565b6000610ae7602383610a7a565b9150610af282610a8b565b604082019050919050565b60006020820190508181036000830152610b1681610ada565b9050919050565b7f41756374696f6e2068617320636f6e636c756465640000000000000000000000600082015250565b6000610b53601583610a7a565b9150610b5e82610b1d565b602082019050919050565b60006020820190508181036000830152610b8281610b46565b9050919050565b7f5375626d6974746564206269642076616c7565206d757374206265206772656160008201527f746572207468616e203000000000000000000000000000000000000000000000602082015250565b6000610be5602a83610a7a565b9150610bf082610b89565b604082019050919050565b60006020820190508181036000830152610c1481610bd8565b9050919050565b7f5375626d6974746564206269642076616c7565206973206c6f7765722074686160008201527f6e207468652063757272656e7420707269636500000000000000000000000000602082015250565b6000610c77603383610a7a565b9150610c8282610c1b565b604082019050919050565b60006020820190508181036000830152610ca681610c6a565b9050919050565b6000610cb88261089f565b9150610cc38361089f565b9250828201905080821115610cdb57610cda6109d5565b5b9291505056fea264697066735822122039800aa60525f06106dc728f6a47efbf5890e66dd3aef20f79a4e156bd7a428a64736f6c63430008110033"

const abi = contractAbi.abi;
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contractFactory = new ethers.ContractFactory(abi, contractBytecode, signer);
const ContractDeployer = () => {
    const [reservePrice, setReservePrice] = useState('');
    const [auctionDuration, setAuctionDuration] = useState('');
    const [priceDecrement, setPriceDecrement] = useState('');
    const [contractAddress, setContractAddress] = useState('');

    const deployContract = async () => {
        await window.ethereum.enable();
        const contract = await contractFactory.deploy(reservePrice, auctionDuration, priceDecrement);
        await contract.deployTransaction.wait();
        setContractAddress(contract.address);
    };
    
    return (
        <div>
            <label>
                Reserve Price:
                <input type="text" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} />
            </label>
            <label>
                Auction Duration:
                <input type="text" value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)} />
            </label>
            <label>
                Price Decrement:
                <input type="text" value={priceDecrement} onChange={(e) => setPriceDecrement(e.target.value)} />
            </label>
            <button onClick={deployContract}>Deploy Contract</button>
            {contractAddress && <p>Deployed contract at address: {contractAddress}</p>}
        </div>
    );
    }
    
    export default ContractDeployer;
    