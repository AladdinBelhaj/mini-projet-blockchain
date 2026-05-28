import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function RoleManager() {
  const { account, identity, identityManager } = useWeb3();
  const [targetAddress, setTargetAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('VIEWER');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Role hashes from contract
  const ADMIN_ROLE = ethers.ZeroHash; // DEFAULT_ADMIN_ROLE is 0x0000000000000000000000000000000000000000000000000000000000000000
  const EDITOR_ROLE = ethers.id("EDITOR_ROLE");
  const VIEWER_ROLE = ethers.id("VIEWER_ROLE");

  useEffect(() => {
    const checkAdmin = async () => {
      if (identityManager && account) {
        const isUserAdmin = await identityManager.hasRole(ADMIN_ROLE, account);
        setIsAdmin(isUserAdmin);
        if (isUserAdmin) {
          fetchUsers();
        }
      }
    };
    checkAdmin();
  }, [identityManager, account]);

  const fetchUsers = async () => {
    // For demonstration, we listen to IdentityRegistered events to compile a list of users
    try {
      const filter = identityManager.filters.IdentityRegistered();
      const events = await identityManager.queryFilter(filter, 0, 'latest');
      
      const userList = await Promise.all(events.map(async (event) => {
        const userAddress = event.args[0];
        const dispName = event.args[1];
        
        // Fetch current roles
        const isUserAdmin = await identityManager.hasRole(ADMIN_ROLE, userAddress);
        const isUserEditor = await identityManager.hasRole(EDITOR_ROLE, userAddress);
        const isUserViewer = await identityManager.hasRole(VIEWER_ROLE, userAddress);

        return {
          address: userAddress,
          displayName: dispName,
          isAdmin: isUserAdmin,
          isEditor: isUserEditor,
          isViewer: isUserViewer
        };
      }));

      // Remove duplicates by address
      const uniqueUsers = userList.filter((v, i, a) => a.findIndex(t => t.address === v.address) === i);
      setUsers(uniqueUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(targetAddress)) {
      setError('Invalid Ethereum address');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      let roleHash;
      if (selectedRole === 'ADMIN') roleHash = ADMIN_ROLE;
      else if (selectedRole === 'EDITOR') roleHash = EDITOR_ROLE;
      else roleHash = VIEWER_ROLE;

      const tx = await identityManager.assignRole(targetAddress, roleHash);
      await tx.wait();
      alert(`Role ${selectedRole} successfully assigned!`);
      setTargetAddress('');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeRole = async (userAddress, roleName) => {
    if (!window.confirm(`Are you sure you want to revoke ${roleName} role from this user?`)) return;
    setIsLoading(true);
    try {
      let roleHash;
      if (roleName === 'ADMIN') roleHash = ADMIN_ROLE;
      else if (roleName === 'EDITOR') roleHash = EDITOR_ROLE;
      else roleHash = VIEWER_ROLE;

      const tx = await identityManager.revokeRoleFromUser(userAddress, roleHash);
      await tx.wait();
      alert(`Role ${roleName} successfully revoked!`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.reason || err.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Unauthorized</h3>
        </div>
        <div className="card-body">
          <p className="text-muted text-center">
            You must have the <strong>ADMIN_ROLE</strong> to manage platform credentials and assign/revoke roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-manager-grid">
      <div className="card">
        <div className="card-header">
          <h3>Grant Role to Identity</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleAssignRole}>
            <div className="form-group">
              <label>User Wallet Address</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="0x..." 
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label>Select Role</label>
              <select 
                className="form-control" 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isLoading}
              >
                <option value="VIEWER">VIEWER_ROLE (Read docs, verify hashes)</option>
                <option value="EDITOR">EDITOR_ROLE (Upload, manage access)</option>
                <option value="ADMIN">ADMIN_ROLE (System administration)</option>
              </select>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Assign Role'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Decentralized Identities (SSI Registry)</h3>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Address</th>
                  <th>Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.address}>
                    <td>
                      <div className="user-table-name">
                        <span className="avatar-circle">{u.displayName.slice(0,2).toUpperCase()}</span>
                        {u.displayName}
                      </div>
                    </td>
                    <td className="text-monospace text-xs">{u.address.slice(0, 10)}...{u.address.slice(-6)}</td>
                    <td>
                      <div className="flex-row gap-1">
                        {u.isAdmin && <span className="badge badge-admin">ADMIN</span>}
                        {u.isEditor && <span className="badge badge-editor">EDITOR</span>}
                        {u.isViewer && <span className="badge badge-viewer">VIEWER</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex-row gap-1">
                        {u.isEditor && (
                          <button 
                            className="btn btn-xs btn-danger"
                            onClick={() => handleRevokeRole(u.address, 'EDITOR')}
                            disabled={isLoading}
                          >
                            Revoke Editor
                          </button>
                        )}
                        {u.isViewer && (
                          <button 
                            className="btn btn-xs btn-danger"
                            onClick={() => handleRevokeRole(u.address, 'VIEWER')}
                            disabled={isLoading}
                          >
                            Revoke Viewer
                          </button>
                        )}
                        {u.isAdmin && u.address !== account && (
                          <button 
                            className="btn btn-xs btn-danger"
                            onClick={() => handleRevokeRole(u.address, 'ADMIN')}
                            disabled={isLoading}
                          >
                            Revoke Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
