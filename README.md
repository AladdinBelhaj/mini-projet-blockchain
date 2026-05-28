# Secure Document Sharing Platform (SSI + Blockchain + IPFS)

A secure decentralized web application designed to store, manage, and share documents with strict access control using Ethereum Smart Contracts, IPFS (Pinata), MetaMask, and a simplified Self-Sovereign Identity (SSI) model.

## Features

### 1. Decentralized Identity (Simplified SSI)
- Built-in user self-registration in the `IdentityManager` contract.
- Role-based Access Control (RBAC): Admin, Editor, and Viewer credentials managed directly on-chain.
- **Bonus**: Admins can assign and revoke credentials dynamically.

### 2. Secure Document Uploads & Storage
- Web Crypto API AES-GCM 256-bit client-side encryption.
- Direct uploads of encrypted payloads to IPFS (pinnable via Pinata).
- SHA-256 integrity hash verification checks registered on the blockchain.

### 3. Smart Contract Access Control
- Granular, per-document permissions controlled directly by owners.
- **Bonus**: Real-time permission revocation.
- **Bonus**: On-chain audit timeline logging all uploads, grants, and file views.

## Technology Stack
- **Solidity**: Smart contracts
- **Hardhat**: Development environment
- **Ethers.js v6**: Blockchain interface
- **React + Vite**: Frontend UI
- **Web Crypto API**: File encryption/decryption
- **Pinata SDK**: IPFS Pinning

## Quick Start
Please refer to [INSTALL.md](file:///C:/Users/Asus/Desktop/projet_blockchain/INSTALL.md) for full instructions.
