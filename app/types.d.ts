// Add Ethers.js types
// This would ideally be in a global.d.ts
declare global {
  interface Window {
    ethereum: any;
  }
}
export {};

