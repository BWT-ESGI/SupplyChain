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

  // Deploy EscrowPayment with SupplyChain address
  const EscrowPayment = await hre.ethers.getContractFactory("EscrowPayment");
  const escrowPayment = await EscrowPayment.deploy(supplyChainAddress);
  await escrowPayment.waitForDeployment();
  const escrowAddress = await escrowPayment.getAddress();
  console.log(`EscrowPayment deployed to: ${escrowAddress}`);

  console.log("\n--- Copy these addresses to your frontend ---");
  console.log(`SUPPLY_CHAIN_ADDRESS="${supplyChainAddress}"`);
  console.log(`ESCROW_ADDRESS="${escrowAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
