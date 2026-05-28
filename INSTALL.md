# Installation and Configuration Guide

This document explains how to set up, deploy, and run the Decentralized Document Sharing Platform locally.

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x or v22.x recommended)
- **NPM** (normally bundled with Node.js)
- **MetaMask browser extension**

---

## 1. Smart Contract Setup & Local Blockchain

1. Install the root dependencies:
   ```bash
   npm install
   ```

2. Start a local hardhat blockchain node:
   ```bash
   npx hardhat node
   ```
   *Keep this terminal window open. It will print 20 test accounts with private keys.*

3. Deploy the contracts to the local network:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   *Note down the addresses printed in the terminal:*
   - `IdentityManager deployed to: 0x...`
   - `DocumentRegistry deployed to: 0x...`

4. Copy the compiled contract artifacts (ABIs) to the frontend:
   - Create a folder `frontend/src/contracts/` if it doesn't exist.
   - Copy the files `artifacts/contracts/IdentityManager.sol/IdentityManager.json` and `artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json` into `frontend/src/contracts/`.

5. Configure contract addresses in frontend:
   - Open `frontend/src/services/contractService.js`.
   - Update `identityManagerAddress` and `documentRegistryAddress` with your newly deployed contract addresses.

---

## 2. Frontend Configuration & Execution

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (Optional, for Pinata IPFS uploads):
   - Duplicate `.env.example` and rename it to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Provide your **Pinata JWT** and **Pinata Gateway domain** from your Pinata dashboard.
   - *If no keys are provided, the frontend will automatically switch to a developer simulation mode allowing you to test the full application logic without an active Pinata subscription.*

4. Launch the local React developer server:
   ```bash
   npm run dev
   ```
   - Open the URL printed (typically `http://localhost:5173`) in your browser.

---

## 3. MetaMask Configuration

To interact with the local blockchain:
1. Open the MetaMask extension.
2. Add a new network manually:
   - **Network Name**: Hardhat Localhost
   - **RPC URL**: `http://127.0.5173` or `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Import one of the private keys printed by `npx hardhat node` (e.g., Account #0 for Admin role, Account #1 for Editor/Viewer roles) to get access to 10,000 mock ETH.
