import { ethers } from "ethers";

// Fallback to local hardhat nodes for un-deployed local testing
let identityManagerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
let documentRegistryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

import IdentityManagerArtifact from "../contracts/IdentityManager.json";
import DocumentRegistryArtifact from "../contracts/DocumentRegistry.json";

export const setContractAddresses = (identity, registry) => {
  if (identity) identityManagerAddress = identity;
  if (registry) documentRegistryAddress = registry;
};

export const getContractInstances = async (signerOrProvider) => {
  const identityManager = new ethers.Contract(
    identityManagerAddress,
    IdentityManagerArtifact.abi,
    signerOrProvider
  );
  const documentRegistry = new ethers.Contract(
    documentRegistryAddress,
    DocumentRegistryArtifact.abi,
    signerOrProvider
  );
  return { identityManager, documentRegistry };
};
