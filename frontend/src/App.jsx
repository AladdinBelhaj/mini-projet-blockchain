import React, { useState } from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Layout from './components/Layout';
import DocumentList from './components/DocumentList';
import DocumentUpload from './components/DocumentUpload';
import RoleManager from './components/RoleManager';
import AccessLog from './components/AccessLog';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { account, identity } = useWeb3();

  // If no wallet connected, show standard layout with a notice
  if (!account) {
    return (
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="card text-center p-12 max-w-lg mx-auto m-t-12 bg-glass">
          <div className="lock-icon-lg m-b-4">🔐</div>
          <h2>Access Denied</h2>
          <p className="text-muted m-b-6">
            This document sharing platform utilizes Ethereum Smart Contracts for decentralized access control and identity validation. Please connect your MetaMask wallet to start.
          </p>
        </div>
      </Layout>
    );
  }

  // If connected, but not registered in the system (simplifed SSI check)
  if (!identity) {
    return (
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="card text-center p-12 max-w-lg mx-auto m-t-12 bg-glass">
          <div className="user-icon-lg m-b-4">👤</div>
          <h2>Identity Registry Required</h2>
          <p className="text-muted m-b-6">
            Your MetaMask wallet is connected, but you have not registered your name in our SSI (Self-Sovereign Identity) registry contract yet. Register your details above to activate your decentralized ID.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DocumentList />}
      {activeTab === 'upload' && <DocumentUpload onUploadSuccess={() => setActiveTab('dashboard')} />}
      {activeTab === 'roles' && <RoleManager />}
      {activeTab === 'logs' && <AccessLog />}
    </Layout>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}
