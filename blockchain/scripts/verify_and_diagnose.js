const hre = require("hardhat");

async function main() {
    const ESCROW_ADDRESS = "0x4529ab5ACAB18cFAe13ebD4b13B2bb03Bb234659";
    const SUPPLY_CHAIN_ADDRESS = "0x3D464790b395Ef1D4229eb7fbBE13EE581F242Ce";

    console.log(`Checking configuration...`);
    console.log(`Frontend Escrow: ${ESCROW_ADDRESS}`);
    console.log(`Frontend SupplyChain: ${SUPPLY_CHAIN_ADDRESS}`);

    try {
        const EscrowPayment = await hre.ethers.getContractFactory("EscrowPayment");
        const escrow = EscrowPayment.attach(ESCROW_ADDRESS);

        console.log("Reading SupplyChain address from Escrow contract...");
        const linkedSupplyChain = await escrow.supplyChain();
        console.log(`Escrow is linked to SupplyChain: ${linkedSupplyChain}`);

        if (linkedSupplyChain.toLowerCase() === SUPPLY_CHAIN_ADDRESS.toLowerCase()) {
            console.log("✅ SUCCESS: Addresses match!");
        } else {
            console.log("❌ CRITICAL MISMATCH: The Escrow contract is linked to a DIFFERENT SupplyChain contract.");
            console.log("This causes calls to fail because Escrow looks for lots on the WRONG contract.");
            console.log("Please redeploy both contracts or update the SupplyChain address in your frontend.");
        }

    } catch (error) {
        console.error("Error connecting to contract:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
