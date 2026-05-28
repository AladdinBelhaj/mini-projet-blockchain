import { PinataSDK } from "pinata";

// Using a placeholder API key strategy as requested
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || ""; 
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || "gateway.pinata.cloud";

export const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
});

export const uploadToIPFS = async (file) => {
  if (!PINATA_JWT) {
    console.warn("Pinata JWT not found. Simulating IPFS upload.");
    return `QmSimulated${Math.floor(Math.random()*1000000)}ForDev`;
  }
  
  try {
    const upload = await pinata.upload.public.file(file);
    return upload.cid;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
};

export const getIPFSUrl = (cid) => {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
};
