import React from 'react';
import WalletConnect from './WalletConnect';

export default function Layout({ children, activeTab, setActiveTab }) {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>SecDoc Share</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <span className="nav-icon">📤</span>
            Upload Document
          </button>
          <button 
            className={`nav-item ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <span className="nav-icon">🔑</span>
            Identity & Roles
          </button>
          <button 
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <span className="nav-icon">📜</span>
            Access History
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="status-dot online"></span>
            Local Hardhat Node
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>
              {activeTab === 'dashboard' && 'Document Dashboard'}
              {activeTab === 'upload' && 'Upload Document'}
              {activeTab === 'roles' && 'Identity & SSI Roles'}
              {activeTab === 'logs' && 'Audit Trails & Access Logs'}
            </h1>
            <p className="header-subtitle">
              {activeTab === 'dashboard' && 'Manage and access your secure documents'}
              {activeTab === 'upload' && 'Encrypt and pin new documents to IPFS'}
              {activeTab === 'roles' && 'Manage decentralized identities and credentials'}
              {activeTab === 'logs' && 'On-chain audit logs of all access requests'}
            </p>
          </div>
          <WalletConnect />
        </header>

        <section className="content-area">
          {children}
        </section>
      </main>
    </div>
  );
}
