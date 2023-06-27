import { useState, useEffect } from "react";
import { ethers } from "ethers";

function App() {
  const [state, setState] = useState({
    provider: null,
    signer: null,
    contract: null,
  });
  const [account, setAccount] = useState("None");
  const [contractAddress, setContractAddress] = useState("");  // Add this line
  
  useEffect(() => {
    const connectWallet = async () => {
      const contractABI = abi.abi;
      try {
        const { ethereum } = window;

        if (ethereum) {
          const account = await ethereum.request({
            method: "eth_requestAccounts",
          });

          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });

          window.ethereum.on("accountsChanged", () => {
            window.location.reload();
          });

          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );
          setAccount(account);
          setState({ provider, signer, contract });
        } else {
          alert("Please install metamask");
        }
      } catch (error) {
        console.log(error);
      }
    };
    if(contractAddress) {
      connectWallet();
    }
  }, [contractAddress]); // Add contractAddress as a dependency
  
  // You'll also need to create a new input field in your JSX that updates contractAddress
  return (
    <div style={{ backgroundColor: "#EFEFEF", height: "100%" }}>
      <p
        className="text-muted lead "
        style={{ marginTop: "10px", marginLeft: "5px" }}
      >
        <small>Connected Account - {account}</small>
      </p>
      <div className="container">
        <label>
          Contract Address:
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export default App;

