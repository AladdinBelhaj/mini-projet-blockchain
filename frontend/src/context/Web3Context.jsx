import { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { getContractInstances } from '../services/contractService';

export const Web3Context = createContext(null);

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [identityManager, setIdentityManager] = useState(null);
  const [documentRegistry, setDocumentRegistry] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const activeAccount = accounts[0];
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(activeAccount);

      const contracts = await getContractInstances(web3Signer);
      setIdentityManager(contracts.identityManager);
      setDocumentRegistry(contracts.documentRegistry);

      await loadIdentity(contracts.identityManager, activeAccount);

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const loadIdentity = async (idManager, acc) => {
    try {
      const id = await idManager.getIdentity(acc);
      if (id[1]) { // isActive
        let role = "VIEWER";
        if (await idManager.hasRole(await idManager.DEFAULT_ADMIN_ROLE(), acc)) role = "ADMIN";
        else if (await idManager.hasRole(await idManager.EDITOR_ROLE(), acc)) role = "EDITOR";
        
        setIdentity({
          displayName: id[0],
          isActive: true,
          role: role
        });
      } else {
        setIdentity(null);
      }
    } catch (e) {
      setIdentity(null);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet(); // Reconnect with new account
        } else {
          setAccount(null);
          setIdentity(null);
        }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  return (
    <Web3Context.Provider value={{
      account, provider, signer,
      identityManager, documentRegistry,
      identity, isConnecting, error,
      connectWallet, loadIdentity
    }}>
      {children}
    </Web3Context.Provider>
  );
};
