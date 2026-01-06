import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Use Infura RPC - same as MetaMask for consistency
// If you have an Infura API key, use: https://sepolia.infura.io/v3/YOUR_API_KEY
// Otherwise, try the public endpoint (may not work without API key)
const INFURA_API_KEY = '8158eb4d1fed430ea5d8f2969758ad21' // Your Infura API key
const SEPOLIA_RPC = `https://sepolia.infura.io/v3/${INFURA_API_KEY}`

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
