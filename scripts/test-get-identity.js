import hre from "hardhat";

async function main() {
  const [admin] = await hre.ethers.getSigners();
  const identityManagerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const IdentityManager = await hre.ethers.getContractFactory("IdentityManager");
  const identityManager = IdentityManager.attach(identityManagerAddress);

  console.log("Calling getIdentity for", admin.address);
  const id = await identityManager.getIdentity(admin.address);
  console.log("getIdentity result:", id);
  console.log("typeof id:", typeof id);
  console.log("Array entries:", Object.entries(id));
  console.log("id[0]:", id[0]);
  console.log("id.displayName:", id.displayName);
  console.log("id.isActive:", id.isActive);
  console.log("id[1]:", id[1]);
}

main().catch(console.error);
