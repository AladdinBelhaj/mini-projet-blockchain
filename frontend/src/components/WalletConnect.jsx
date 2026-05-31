import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function WalletConnect() {
  const { account, identity, connectWallet, isConnecting, error, identityManager, loadIdentity } = useWeb3();
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsRegistering(true);
    try {
      const tx = await identityManager.registerIdentity(displayName);
      await tx.wait();
      // Don't reload the page, just reload identity
      await loadIdentity(identityManager, account);
      setDisplayName('');
    } catch (err) {
      console.error(err);
      alert("Registration failed. See console.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (!account) {
    return (
      <div className="wallet-connect-container">
        <button 
          className="btn btn-primary btn-connect"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="spinner"></span> Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>
        {error && <p className="connect-error">{error}</p>}
      </div>
    );
  }

  // Registered user status
  if (identity) {
    return (
      <div className="user-profile-badge">
        <div className="user-avatar">
          {identity.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="user-info">
          <span className="user-name">{identity.displayName}</span>
          <span className={`role-badge ${identity.role.toLowerCase()}`}>
            {identity.role}
          </span>
        </div>
        <div className="wallet-address-badge">
          {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      </div>
    );
  }

  // Connected to MetaMask but not registered in the system (no Identity)
  return (
    <div className="register-identity-panel">
      <div className="unregistered-alert">
        <span className="warning-icon">⚠️</span>
        <div>
          <strong>Identity Required</strong>
          <p>Please register your digital identity to access the platform.</p>
        </div>
      </div>
      <form onSubmit={handleRegister} className="register-form">
        <input 
          type="text" 
          placeholder="Enter display name" 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isRegistering}
          className="form-control"
          required
        />
        <button 
          type="submit" 
          className="btn btn-success"
          disabled={isRegistering}
        >
          {isRegistering ? 'Registering...' : 'Register Identity'}
        </button>
      </form>
    </div>
  );
}
