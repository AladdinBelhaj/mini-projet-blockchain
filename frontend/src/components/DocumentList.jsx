import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getIPFSUrl } from '../services/ipfsService';
import { decryptFile, importKey, computeSHA256 } from '../services/cryptoService';
import AccessManager from './AccessManager';

export default function DocumentList() {
  const { account, documentRegistry } = useWeb3();
  const [myDocs, setMyDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null); // For managing access
  const [verifyingDocId, setVerifyingDocId] = useState(null);
  const [verificationResult, setVerificationResult] = useState({});

  useEffect(() => {
    if (documentRegistry && account) {
      fetchDocuments();
    }
  }, [documentRegistry, account]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      // Get IDs
      const myDocIds = await documentRegistry.getMyDocuments();
      const sharedDocIds = await documentRegistry.getAccessibleDocuments();

      const myDocsMeta = await Promise.all(
        myDocIds.map(id => documentRegistry.documents(id).then(d => ({ ...d, id: id.toString() })))
      );

      const sharedDocsMeta = await Promise.all(
        sharedDocIds.map(id => documentRegistry.documents(id).then(d => ({ ...d, id: id.toString() })))
      );

      setMyDocs(myDocsMeta);
      setSharedDocs(sharedDocsMeta);
    } catch (err) {
      console.error("Error fetching docs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAndDecrypt = async (doc) => {
    try {
      const url = getIPFSUrl(doc.cid);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to download from IPFS Gateway");

      const fileBlob = await res.blob();
      let finalBlob = fileBlob;

      if (doc.isEncrypted) {
        // Fetch key (owner fetches from local, shared user fetches from simulated key registry)
        let keyHex = localStorage.getItem(`enc_key_${doc.id}`);
        if (!keyHex) {
          keyHex = localStorage.getItem(`enc_key_shared_${doc.id}_${account}`);
        }

        if (!keyHex) {
          // If no key locally, prompt user to paste
          const inputKey = window.prompt("This file is encrypted. Please paste the decryption AES key (Hex):");
          if (!inputKey) return;
          keyHex = inputKey;
        }

        const key = await importKey(keyHex);
        finalBlob = await decryptFile(fileBlob, key);
      }

      // Download file to browser
      const downloadUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Decryption / Download failed: " + err.message);
    }
  };

  const handleVerifyIntegrity = async (doc) => {
    setVerifyingDocId(doc.id);
    try {
      // Select local file to verify against
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const hash = await computeSHA256(file);
        const isValid = await documentRegistry.verifyIntegrity(doc.id, hash);

        setVerificationResult(prev => ({
          ...prev,
          [doc.id]: isValid ? 'VALID' : 'INVALID'
        }));
      };
      input.click();
    } catch (err) {
      console.error(err);
      setVerificationResult(prev => ({ ...prev, [doc.id]: 'ERROR' }));
    } finally {
      setVerifyingDocId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12"><span className="spinner"></span> Loading secure vault...</div>;
  }

  return (
    <div className="document-dashboard-container">
      {/* 1. Owned Documents */}
      <div className="dashboard-section m-b-8">
        <div className="section-header">
          <h2>My Secured Vault</h2>
          <span className="count-badge">{myDocs.length}</span>
        </div>
        
        {myDocs.length === 0 ? (
          <div className="card text-center p-8 bg-glass">
            <p className="text-muted">You haven't uploaded any documents yet.</p>
          </div>
        ) : (
          <div className="document-grid">
            {myDocs.map((doc) => (
              <div key={doc.id} className="document-card card">
                <div className="doc-icon">📁</div>
                <div className="doc-meta">
                  <h4 className="doc-title">{doc.fileName}</h4>
                  <div className="doc-sub">
                    <span>Uploaded: {new Date(Number(doc.uploadedAt) * 1000).toLocaleDateString()}</span>
                    <span>CID: {doc.cid.slice(0, 8)}...</span>
                  </div>
                  <div className="flex-row gap-2 m-t-2">
                    {doc.isEncrypted && <span className="badge badge-locked">🔒 AES-256</span>}
                    <span className="badge badge-owner">Owner</span>
                  </div>
                </div>
                <div className="doc-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadAndDecrypt(doc)}>
                    Download
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setSelectedDoc(doc)}>
                    Share Access
                  </button>
                  <button 
                    className="btn btn-info btn-sm" 
                    onClick={() => handleVerifyIntegrity(doc)}
                    disabled={verifyingDocId === doc.id}
                  >
                    {verifyingDocId === doc.id ? 'Checking...' : 'Verify Hash'}
                  </button>
                </div>
                {verificationResult[doc.id] && (
                  <div className={`verification-badge ${verificationResult[doc.id].toLowerCase()}`}>
                    {verificationResult[doc.id] === 'VALID' ? '✅ Integrity Verified' : '❌ Hash Mismatch! Modified!'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Accessible Documents */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Shared With Me</h2>
          <span className="count-badge">{sharedDocs.length}</span>
        </div>
        
        {sharedDocs.length === 0 ? (
          <div className="card text-center p-8 bg-glass">
            <p className="text-muted">No documents have been shared with you.</p>
          </div>
        ) : (
          <div className="document-grid">
            {sharedDocs.map((doc) => (
              <div key={doc.id} className="document-card card">
                <div className="doc-icon">📁</div>
                <div className="doc-meta">
                  <h4 className="doc-title">{doc.fileName}</h4>
                  <div className="doc-sub">
                    <span>Owner: {doc.owner.slice(0, 10)}...</span>
                    <span>CID: {doc.cid.slice(0, 8)}...</span>
                  </div>
                  <div className="flex-row gap-2 m-t-2">
                    {doc.isEncrypted && <span className="badge badge-locked">🔒 AES-256</span>}
                    <span className="badge badge-shared">Shared</span>
                  </div>
                </div>
                <div className="doc-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadAndDecrypt(doc)}>
                    Decrypt & Download
                  </button>
                  <button 
                    className="btn btn-info btn-sm" 
                    onClick={() => handleVerifyIntegrity(doc)}
                    disabled={verifyingDocId === doc.id}
                  >
                    {verifyingDocId === doc.id ? 'Checking...' : 'Verify Hash'}
                  </button>
                </div>
                {verificationResult[doc.id] && (
                  <div className={`verification-badge ${verificationResult[doc.id].toLowerCase()}`}>
                    {verificationResult[doc.id] === 'VALID' ? '✅ Integrity Verified' : '❌ Hash Mismatch!'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access Manager Modal */}
      {selectedDoc && (
        <AccessManager 
          docId={selectedDoc.id} 
          docName={selectedDoc.fileName} 
          onClose={() => setSelectedDoc(null)} 
        />
      )}
    </div>
  );
}
