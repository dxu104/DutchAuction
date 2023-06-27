import React, { useState } from "react";
import { ethers } from "ethers";
import contractAbi from "../contract/BasicDutchAuction.json";

const AuctionInfo = () => {
    const [contractAddress, setContractAddress] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [auctionInfo, setAuctionInfo] = useState(null);
    const [userBalance, setUserBalance] = useState(0);

    const showInfo = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const auctionContract = new ethers.Contract(
                contractAddress,
                contractAbi.abi,
                signer
            );

            const minimumAcceptablePrice = await auctionContract.minimumAcceptablePrice;
            const auctionDurationInBlocks = await auctionContract.auctionDurationInBlocks;
            const priceDecrementPerBlock = await auctionContract.priceDecrementPerBlock;
            const currentPrice = await auctionContract.getCurrentAuctionPrice;

            const initialParticipant = await auctionContract.initialParticipant;
            let winner;
            if (!await auctionContract.hasReceivedValidBid) {
                winner = "Auction is still open";
            }
            else {
                winner = initialParticipant;
            }

            setAuctionInfo({
                winner,
                minimumAcceptablePrice,
                auctionDurationInBlocks,
                priceDecrementPerBlock,
                currentPrice,
            });

            const balance = await auctionContract.getBalance(userAddress);
            setUserBalance(balance);

        } catch (error) {
            console.error(error);
        }
    };

    const retrieveRefund = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const auctionContract = new ethers.Contract(
                contractAddress,
                contractAbi.abi,
                signer
            );

            await auctionContract.retrieveRefund();
            alert('Refund retrieved');

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <label>
                Contract Address:
                <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                />
            </label>
            <label>
                User Address:
                <input
                    type="text"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                />
            </label>
            <button onClick={showInfo}>Show Info</button>
            <button onClick={retrieveRefund}>Retrieve Refund</button>

            {auctionInfo && (
                <div>
                    <p>Winner: {auctionInfo.winner}</p>
                    <p>Minimum Acceptable Price: {auctionInfo.minimumAcceptablePrice.toString()}</p>
                    <p>
                        Duration of Auction in Blocks:{" "}
                        {auctionInfo.auctionDurationInBlocks.toString()}
                    </p>
                    <p>
                        Price Decrement Per Block: {auctionInfo.priceDecrementPerBlock.toString()}
                    </p>
                    <p>Current Price: {auctionInfo.currentPrice.toString()}</p>
                    <p>User Balance: {userBalance.toString()}</p>
                </div>
            )}

        </div>
    );
};

export default AuctionInfo;
