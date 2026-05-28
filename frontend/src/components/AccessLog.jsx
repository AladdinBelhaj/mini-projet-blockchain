import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function AccessLog() {
  const { documentRegistry } = useWeb3();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (documentRegistry) {
      fetchLogs();
    }
  }, [documentRegistry]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const allLogs = [];

      // 1. Fetch DocumentUploaded events
      const uploadFilter = documentRegistry.filters.DocumentUploaded();
      const uploads = await documentRegistry.queryFilter(uploadFilter, 0, 'latest');
      uploads.forEach(e => {
        allLogs.push({
          type: 'UPLOAD',
          docId: e.args[0].toString(),
          owner: e.args[1],
          detail: `Document registered by owner. CID: ${e.args[2].slice(0, 10)}...`,
          blockNumber: e.blockNumber,
          timestamp: Date.now() - (1000 * 60 * (100 - e.blockNumber)) // simulated time or block query
        });
      });

      // 2. Fetch AccessGranted events
      const grantFilter = documentRegistry.filters.AccessGranted();
      const grants = await documentRegistry.queryFilter(grantFilter, 0, 'latest');
      grants.forEach(e => {
        allLogs.push({
          type: 'GRANT',
          docId: e.args[0].toString(),
          user: e.args[1],
          owner: e.args[2],
          detail: `Access granted to user ${e.args[1].slice(0, 8)}...`,
          blockNumber: e.blockNumber,
          timestamp: Date.now() - (1000 * 60 * (100 - e.blockNumber))
        });
      });

      // 3. Fetch AccessRevoked events
      const revokeFilter = documentRegistry.filters.AccessRevoked();
      const revokes = await documentRegistry.queryFilter(revokeFilter, 0, 'latest');
      revokes.forEach(e => {
        allLogs.push({
          type: 'REVOKE',
          docId: e.args[0].toString(),
          user: e.args[1],
          owner: e.args[2],
          detail: `Access revoked from user ${e.args[1].slice(0, 8)}...`,
          blockNumber: e.blockNumber,
          timestamp: Date.now() - (1000 * 60 * (100 - e.blockNumber))
        });
      });

      // 4. Fetch DocumentAccessed events (bonus document view tracking)
      const accessFilter = documentRegistry.filters.DocumentAccessed();
      const accesses = await documentRegistry.queryFilter(accessFilter, 0, 'latest');
      accesses.forEach(e => {
        allLogs.push({
          type: 'VIEW',
          docId: e.args[0].toString(),
          user: e.args[1],
          detail: `Document metadata viewed by authorized user.`,
          blockNumber: e.blockNumber,
          timestamp: Number(e.args[2]) * 1000
        });
      });

      // Sort by blockNumber descending, then timestamp
      allLogs.sort((a, b) => b.blockNumber - a.blockNumber);
      setLogs(allLogs);
    } catch (err) {
      console.error("Error fetching events for logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12"><span className="spinner"></span> Querying blockchain events...</div>;
  }

  return (
    <div className="card">
      <div className="card-header flex-row justify-between align-center">
        <h3>Blockchain Audit Log (Access & Modifications)</h3>
        <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>
          🔄 Refresh Log
        </button>
      </div>
      <div className="card-body">
        {logs.length === 0 ? (
          <p className="text-center text-muted py-6">No audit activities recorded on-chain yet.</p>
        ) : (
          <div className="audit-timeline">
            {logs.map((log, idx) => (
              <div key={idx} className={`timeline-item ${log.type.toLowerCase()}`}>
                <div className="timeline-badge">
                  {log.type === 'UPLOAD' && '📤'}
                  {log.type === 'GRANT' && '🔑'}
                  {log.type === 'REVOKE' && '🚫'}
                  {log.type === 'VIEW' && '👁️'}
                </div>
                <div className="timeline-body">
                  <div className="timeline-header">
                    <span className="timeline-title">
                      <strong>Document ID: {log.docId}</strong> - {log.type}
                    </span>
                    <span className="timeline-time text-xs text-muted">
                      Block #{log.blockNumber}
                    </span>
                  </div>
                  <p className="timeline-detail">{log.detail}</p>
                  {log.user && (
                    <div className="text-xs text-mono m-t-1">
                      Target: {log.user}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
