import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const IdentityManager = await hre.ethers.getContractFactory("IdentityManager");
  const identityManager = await IdentityManager.deploy();
  await identityManager.waitForDeployment();
  const identityAddress = await identityManager.getAddress();
  console.log("IdentityManager deployed to:", identityAddress);

  const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy(identityAddress);
  await documentRegistry.waitForDeployment();
  const documentAddress = await documentRegistry.getAddress();
  console.log("DocumentRegistry deployed to:", documentAddress);

  console.log("\nDeployment complete.");
  console.log("To use these in frontend, copy the addresses above and ABI artifacts.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
