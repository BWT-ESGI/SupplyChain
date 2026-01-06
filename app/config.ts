import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Use public RPC with timeout configuration
// Alternative RPCs: rpc.sepolia.org, ethereum-sepolia-rpc.publicnode.com, sepolia.gateway.tenderly.co
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC, {
      timeout: 30_000, // 30 seconds timeout
      retryCount: 3,
      retryDelay: 1_000,
    }), 
  },
  ssr: true,
})
