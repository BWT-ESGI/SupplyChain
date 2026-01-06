import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy SupplyChain
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();
  const supplyChainAddress = await supplyChain.getAddress();
  console.log(`SupplyChain deployed to: ${supplyChainAddress}`);

  console.log("\n--- Copy this address to your frontend ---");
  console.log(`SUPPLY_CHAIN_ADDRESS="${supplyChainAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
