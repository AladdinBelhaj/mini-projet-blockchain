import hre from "hardhat";

async function main() {
  const [admin] = await hre.ethers.getSigners();
  const identityManagerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const documentRegistryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = DocumentRegistry.attach(documentRegistryAddress);

  console.log("Calling getMyDocuments for", admin.address);
  try {
    const myDocs = await documentRegistry.getMyDocuments();
    console.log("getMyDocuments result:", myDocs);
  } catch (e) {
    console.error("getMyDocuments error:", e);
  }
  console.log("Calling getAccessibleDocuments");
  try {
    const accessibleDocs = await documentRegistry.getAccessibleDocuments();
    console.log("getAccessibleDocuments result:", accessibleDocs);
  } catch (e) {
    console.error("getAccessibleDocuments error:", e);
  }
}

main().catch(console.error);
