import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Use public RPC - same as Hardhat config for consistency
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC), 
  },
  ssr: true,
})
