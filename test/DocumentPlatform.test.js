import { expect } from "chai";
import hre from "hardhat";

describe("DocumentSharingPlatform", function () {
  let identityManager, documentRegistry;
  let admin, v1, v2;

  before(async function () {
    [admin, v1, v2] = await hre.ethers.getSigners();
    
    const IdentityManager = await hre.ethers.getContractFactory("IdentityManager");
    identityManager = await IdentityManager.deploy();
    await identityManager.waitForDeployment();
    
    const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
    documentRegistry = await DocumentRegistry.deploy(await identityManager.getAddress());
    await documentRegistry.waitForDeployment();
  });

  it("should register identity", async function () {
    await identityManager.connect(v1).registerIdentity("User V1");
    const id = await identityManager.getIdentity(v1.address);
    expect(id.displayName).to.equal("User V1");
    expect(id.isActive).to.equal(true);
  });

  it("should not allow upload without EDITOR_ROLE", async function () {
    await expect(
      documentRegistry.connect(v1).uploadDocument("Qm123", hre.ethers.ZeroHash, "test.pdf", false)
    ).to.be.revertedWith("Requires EDITOR_ROLE or ADMIN_ROLE");
  });

  it("should upload doc with EDITOR_ROLE", async function () {
    const EDITOR_ROLE = await identityManager.EDITOR_ROLE();
    await identityManager.connect(admin).assignRole(v1.address, EDITOR_ROLE);
    
    await documentRegistry.connect(v1).uploadDocument("Qm123", hre.ethers.ZeroHash, "test.pdf", false);
    
    const doc = await documentRegistry.connect(v1).getDocument.staticCall(1);
    expect(doc.owner).to.equal(v1.address);
    expect(doc.cid).to.equal("Qm123");
  });
});
