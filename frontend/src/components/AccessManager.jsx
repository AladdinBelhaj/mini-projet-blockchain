import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function AccessManager({ docId, docName, onClose }) {
  const { documentRegistry, identityManager } = useWeb3();
  const [targetAddress, setTargetAddress] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuthorizedUsers();
  }, [docId]);

  const fetchAuthorizedUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Find historical access grants via contract events
      const filter = documentRegistry.filters.AccessGranted(docId);
      const events = await documentRegistry.queryFilter(filter, 0, 'latest');

      const grantees = [];
      for (const event of events) {
        const userAddr = event.args[1];
        
        // Verify if access is still currently active
        const hasActiveAccess = await documentRegistry.hasAccess(docId, userAddr);
        if (hasActiveAccess) {
          // Fetch identity if registered
          let name = 'Unregistered Address';
          try {
            const id = await identityManager.getIdentity(userAddr);
            if (id[1]) name = id[0];
          } catch(e) {}

          grantees.push({
            address: userAddr,
            displayName: name
          });
        }
      }

      // Filter uniques
      const uniqueGrantees = grantees.filter((v, i, a) => a.findIndex(t => t.address === v.address) === i);
      setAuthorizedUsers(uniqueGrantees);
    } catch (err) {
      console.error("Error fetching authorized users:", err);
      setError("Failed to fetch access list.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(targetAddress)) {
      setError("Invalid Ethereum Address");
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const tx = await documentRegistry.grantAccess(docId, targetAddress);
      await tx.wait();
      alert("Access successfully granted!");
      
      // Share decryption key from localStorage if it exists (Optional helper)
      const encKey = localStorage.getItem(`enc_key_${docId}`);
      if (encKey) {
        // In a real application, you would encrypt the key using the grantee's public key (e.g. via Eth Crypto)
        // For this simplified model, we will save it under a mock shared local registry or alert the user
        localStorage.setItem(`enc_key_shared_${docId}_${targetAddress}`, encKey);
      }

      setTargetAddress('');
      fetchAuthorizedUsers();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Failed to grant access");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (userAddress) => {
    if (!window.confirm(`Revoke access for ${userAddress.slice(0, 8)}...?`)) return;
    setIsLoading(true);
    try {
      const tx = await documentRegistry.revokeAccess(docId, userAddress);
      await tx.wait();
      alert("Access successfully revoked!");
      fetchAuthorizedUsers();
    } catch (err) {
      console.error(err);
      alert(err.reason || err.message || "Failed to revoke access");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Manage Access: {docName}</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleGrant} className="m-b-6">
            <div className="form-group">
              <label>Grant Access to Address</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="0x..." 
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Grant Access'}
                </button>
              </div>
              {error && <p className="error-text m-t-2">{error}</p>}
            </div>
          </form>

          <h4>Currently Authorized</h4>
          {authorizedUsers.length === 0 ? (
            <p className="text-muted text-center py-4">No users granted access yet (except the owner).</p>
          ) : (
            <ul className="access-list">
              {authorizedUsers.map((u) => (
                <li key={u.address} className="access-item">
                  <div className="access-item-details">
                    <strong>{u.displayName}</strong>
                    <span className="text-monospace text-xs text-muted">{u.address}</span>
                  </div>
                  <button 
                    className="btn btn-xs btn-danger" 
                    onClick={() => handleRevoke(u.address)}
                    disabled={isLoading}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
