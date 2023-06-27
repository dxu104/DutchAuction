import React from 'react';
import ReactDOM from 'react-dom/client';

import ContractDeployer from './components/AuctionDeploy';
import AuctionInfo from './components/AuctionInfo';
import Bid from './components/Bid';
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from "@ethersproject/providers";


function getLibrary(provider) {
  console.log(provider);  // add this line
  return new Web3Provider(provider);
}



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
  
    <ContractDeployer />
    <AuctionInfo />
    <Bid />
  </React.StrictMode>
);

