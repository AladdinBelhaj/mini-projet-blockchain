import { ethers } from "ethers";

// Fallback to local hardhat nodes for un-deployed local testing
let identityManagerAddress = "YOUR_IDENTITY_ADDRESS"; 
let documentRegistryAddress = "YOUR_REGISTRY_ADDRESS";

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
