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
      console.log("loadIdentity called for", acc);
      const id = await idManager.getIdentity(acc);
      console.log("getIdentity result:", id);
      if (id.isActive) { // Use the named property instead of index
        let role = "VIEWER";
        const adminRole = await idManager.DEFAULT_ADMIN_ROLE();
        const editorRole = await idManager.EDITOR_ROLE();
        if (await idManager.hasRole(adminRole, acc)) role = "ADMIN";
        else if (await idManager.hasRole(editorRole, acc)) role = "EDITOR";
        
        console.log("Setting identity with role:", role);
        setIdentity({
          displayName: id.displayName,
          isActive: true,
          role: role
        });
      } else {
        console.log("Identity not active");
        setIdentity(null);
      }
    } catch (e) {
      console.error("loadIdentity error:", e);
      setIdentity(null);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          // Don't call connectWallet, just update the account
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setIdentity(null);
        }
      };
      
      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        // Some providers expose removeEventListener, others use removeListener
        if (typeof window.ethereum.removeEventListener === 'function') {
          window.ethereum.removeEventListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeEventListener('chainChanged', handleChainChanged);
        } else if (typeof window.ethereum.removeListener === 'function') {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Load identity when account changes and we have a signer
  useEffect(() => {
    if (account && identityManager) {
      loadIdentity(identityManager, account);
    }
  }, [account, identityManager]);

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
