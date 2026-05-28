import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { uploadToIPFS } from '../services/ipfsService';
import { computeSHA256, encryptFile, generateKey, exportKey } from '../services/cryptoService';

export default function DocumentUpload({ onUploadSuccess }) {
  const { documentRegistry, identity } = useWeb3();
  const [file, setFile] = useState(null);
  const [shouldEncrypt, setShouldEncrypt] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress('Starting upload process...');

    try {
      // 1. Compute original file integrity hash
      setUploadProgress('Computing cryptographic hash (SHA-256)...');
      const fileHash = await computeSHA256(file);

      let finalFileToUpload = file;
      let encryptionKeyHex = '';

      // 2. Encryption (Bonus Feature)
      if (shouldEncrypt) {
        setUploadProgress('Generating AES-256 key & encrypting file...');
        const key = await generateKey();
        encryptionKeyHex = await exportKey(key);
        
        // Encrypt the file data
        finalFileToUpload = await encryptFile(file, key);
      }

      // 3. Upload to IPFS via Pinata
      setUploadProgress('Uploading encrypted payload to IPFS...');
      const cid = await uploadToIPFS(finalFileToUpload);
      setUploadProgress(`Uploaded! CID: ${cid}. Registering on-chain...`);

      // 4. Register metadata on Ethereum
      const tx = await documentRegistry.uploadDocument(
        cid,
        fileHash,
        file.name,
        shouldEncrypt
      );

      setUploadProgress('Awaiting blockchain block confirmation...');
      const receipt = await tx.wait();
      
      // Parse event to get document ID
      const event = receipt.logs
        .map(log => {
          try { return documentRegistry.interface.parseLog(log); } 
          catch(e) { return null; }
        })
        .find(e => e && e.name === 'DocumentUploaded');
      
      const docId = event ? event.args[0].toString() : 'Unknown';

      // 5. Store encryption key locally if encrypted (Bonus feature)
      if (shouldEncrypt && docId !== 'Unknown') {
        localStorage.setItem(`enc_key_${docId}`, encryptionKeyHex);
      }

      setUploadProgress('Document successfully stored & verified!');
      alert(`Success! Document registered on blockchain. ID: ${docId}`);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Upload process failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const isAllowedToUpload = identity && (identity.role === 'EDITOR' || identity.role === 'ADMIN');

  if (!isAllowedToUpload) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Access Denied</h3>
        </div>
        <div className="card-body">
          <p className="text-muted text-center">
            You must have either the <strong>EDITOR_ROLE</strong> or <strong>ADMIN_ROLE</strong> to upload files to IPFS and register them on the blockchain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-xl mx-auto">
      <div className="card-header">
        <h3>Pin and Secure Document</h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleUpload}>
          <div className="form-group upload-zone-container">
            <label className="upload-label">
              <input 
                type="file" 
                className="file-input-hidden" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div className="upload-zone">
                <span className="upload-icon">📁</span>
                {file ? (
                  <div className="selected-file">
                    <strong>{file.name}</strong>
                    <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                ) : (
                  <span>Drag & drop or click to choose a file</span>
                )}
              </div>
            </label>
          </div>

          <div className="form-group encryption-toggle-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={shouldEncrypt} 
                onChange={(e) => setShouldEncrypt(e.target.checked)}
                disabled={isUploading}
              />
              <div className="checkbox-custom"></div>
              <div className="checkbox-text">
                <strong>Encrypt before IPFS Upload (AES-GCM 256)</strong>
                <p className="text-xs text-muted">Protects the document content from public gateway exposure.</p>
              </div>
            </label>
          </div>

          {uploadProgress && (
            <div className="progress-indicator">
              <span className="progress-dot pulsing"></span>
              <p className="progress-message">{uploadProgress}</p>
            </div>
          )}

          {error && <p className="error-text m-b-4">{error}</p>}

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={!file || isUploading}
          >
            {isUploading ? 'Processing...' : 'Upload & Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
