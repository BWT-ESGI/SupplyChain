import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

const client = createPublicClient({
    chain: sepolia,
    transport: http('https://sepolia.infura.io/v3/8158eb4d1fed430ea5d8f2969758ad21'),
});

const ESCROW_ADDRESS = '0x520c0552A6d81032aAe7a09577F06a80B0dbbE83';

async function main() {
    console.log(`Reading SupplyChain from Escrow: ${ESCROW_ADDRESS}`);

    try {
        const supplyChainAddress = await client.readContract({
            address: ESCROW_ADDRESS,
            abi: parseAbi(['function supplyChain() view returns (address)']),
            functionName: 'supplyChain',
        });

        console.log(`\n=== RESULT ===`);
        console.log(`REQUIRED_SUPPLY_CHAIN_ADDRESS=${supplyChainAddress}`);
        console.log(`==============\n`);
    } catch (error) {
        console.error('Error reading contract:', error);
    }
}

main();
