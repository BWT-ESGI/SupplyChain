import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { formatEther, encodeFunctionData } from "viem";
import { CONTRACT_ADDRESS as SUPPLY_CHAIN_ADDRESS } from "./useSupplyChain";

const ESCROW_ADDRESS = "0x4529ab5ACAB18cFAe13ebD4b13B2bb03Bb234659";

const ESCROW_ABI = [
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "depositPayment", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "releasePayment", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "refundPayment", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "getPayment", outputs: [{ components: [{ name: "lotId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "seller", type: "address" }, { name: "amount", type: "uint128" }, { name: "createdAt", type: "uint64" }, { name: "releasedAt", type: "uint64" }, { name: "released", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPaymentsCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_index", type: "uint256" }], name: "getPaymentByIndex", outputs: [{ components: [{ name: "lotId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "seller", type: "address" }, { name: "amount", type: "uint128" }, { name: "createdAt", type: "uint64" }, { name: "releasedAt", type: "uint64" }, { name: "released", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "isLotCompleted", outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getContractBalance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "address" }], name: "totalReceived", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "address" }], name: "totalSpent", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "supplyChain", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
] as const;

export type Payment = {
  lotId: number;
  buyer: string;
  seller: string;
  amount: string;
  amountWei: bigint;
  createdAt: number;
  releasedAt: number;
  released: boolean;
};

export function useEscrow() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [contractBalance, setContractBalance] = useState("0");
  const [userTotalReceived, setUserTotalReceived] = useState("0");
  const [userTotalSpent, setUserTotalSpent] = useState("0");
  const [loading, setLoading] = useState(false);

  // Helper to wait for receipt with timeout
  const waitForReceipt = async (hash: `0x${string}`) => {
    if (!publicClient) return;
    try {
      await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000, // 2 minutes timeout
        pollingInterval: 2_000, // Poll every 2 seconds
      });
    } catch (e) {
      console.warn("Transaction may still be pending:", e);
      // Wait a bit and refresh anyway
      await new Promise(r => setTimeout(r, 5000));
    }
  };

  const fetchPayments = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      // Verify configuration
      try {
        const linkedSupplyChain = (await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "supplyChain",
        })) as string;

        if (linkedSupplyChain.toLowerCase() !== SUPPLY_CHAIN_ADDRESS.toLowerCase()) {
          console.error("CRITICAL CONFIGURATION ERROR: Address Mismatch!");
          console.error(`Escrow is linked to SupplyChain: ${linkedSupplyChain}`);
          console.error(`Frontend is using SupplyChain: ${SUPPLY_CHAIN_ADDRESS}`);
          console.error("Please update app/hooks/useSupplyChain.ts or redeploy contracts.");
          alert(`Erreur de configuration: Les contrats ne sont pas synchronisés.\nEscrow attend SupplyChain: ${linkedSupplyChain}\nFrontend utilise: ${SUPPLY_CHAIN_ADDRESS}`);
        }
      } catch (err) {
        console.warn("Could not verify linked supply chain address:", err);
      }

      const count = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "getPaymentsCount",
      })) as bigint;

      const balance = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "getContractBalance",
      })) as bigint;
      setContractBalance(formatEther(balance));

      if (address) {
        const received = (await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "totalReceived",
          args: [address],
        })) as bigint;
        setUserTotalReceived(formatEther(received));

        const spent = (await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "totalSpent",
          args: [address],
        })) as bigint;
        setUserTotalSpent(formatEther(spent));
      }

      const loadedPayments: Payment[] = [];
      for (let i = Number(count) - 1; i >= Math.max(0, Number(count) - 50); i--) {
        const p = (await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "getPaymentByIndex",
          args: [BigInt(i)],
        })) as { lotId: bigint; buyer: string; seller: string; amount: bigint; createdAt: bigint; releasedAt: bigint; released: boolean };

        loadedPayments.push({
          lotId: Number(p.lotId),
          buyer: p.buyer,
          seller: p.seller,
          amount: formatEther(p.amount),
          amountWei: p.amount,
          createdAt: Number(p.createdAt),
          releasedAt: Number(p.releasedAt),
          released: p.released,
        });
      }
      setPayments(loadedPayments);
    } catch (e) {
      console.error("Error fetching payments", e);
    } finally {
      setLoading(false);
    }
  }, [publicClient, address]);

  const getPaymentForLot = useCallback(async (lotId: number): Promise<Payment | null> => {
    if (!publicClient) return null;
    try {
      const p = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "getPayment",
        args: [BigInt(lotId)],
      })) as { lotId: bigint; buyer: string; seller: string; amount: bigint; createdAt: bigint; releasedAt: bigint; released: boolean };

      if (p.amount === BigInt(0)) return null;

      return {
        lotId: Number(p.lotId),
        buyer: p.buyer,
        seller: p.seller,
        amount: formatEther(p.amount),
        amountWei: p.amount,
        createdAt: Number(p.createdAt),
        releasedAt: Number(p.releasedAt),
        released: p.released,
      };
    } catch {
      return null;
    }
  }, [publicClient]);

  const depositPayment = async (lotId: number, priceWei: bigint) => {
    if (!address || !publicClient) throw new Error("Not connected");

    console.log("Attempting to deposit payment for lot:", lotId, "amount:", priceWei.toString());

    try {
      // Use writeContractAsync directly - let MetaMask handle gas estimation
      // But we'll catch and handle errors more gracefully
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "depositPayment",
        args: [BigInt(lotId)],
        value: priceWei,
        // Don't set gas limit - let MetaMask estimate
        // If it fails, we'll see the error message
      });

      console.log("Transaction sent, hash:", hash);
      await waitForReceipt(hash);
      await fetchPayments();
    } catch (error: any) {
      console.error("Error in depositPayment:", error);

      // Check if it's a gas estimation error
      if (error?.message?.includes("gas") || error?.message?.includes("Gas")) {
        console.error("Gas estimation failed. This might mean:");
        console.error("1. The SupplyChain contract doesn't have getLotPriceAndCreator function");
        console.error("2. The contract consumes too much gas");
        console.error("3. The RPC is having issues");

        // Try one more time with a very conservative gas limit
        console.log("Retrying with fixed gas limit of 3M...");
        try {
          const hash = await writeContractAsync({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: "depositPayment",
            args: [BigInt(lotId)],
            value: priceWei,
            gas: BigInt(3_000_000), // Very conservative limit
          });
          console.log("Retry successful, hash:", hash);
          await waitForReceipt(hash);
          await fetchPayments();
        } catch (retryError: any) {
          console.error("Retry also failed:", retryError);
          throw new Error(`Failed to deposit payment: ${retryError?.message || retryError}`);
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  };

  const releasePayment = async (lotId: number) => {
    if (!address) throw new Error("Not connected");
    const hash = await writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "releasePayment",
      args: [BigInt(lotId)],
    });
    await waitForReceipt(hash);
    await fetchPayments();
  };

  const refundPayment = async (lotId: number) => {
    if (!address) throw new Error("Not connected");
    const hash = await writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "refundPayment",
      args: [BigInt(lotId)],
    });
    await waitForReceipt(hash);
    await fetchPayments();
  };

  useEffect(() => {
    if (publicClient) fetchPayments();
  }, [publicClient, fetchPayments]);

  return {
    payments,
    contractBalance,
    userTotalReceived,
    userTotalSpent,
    loading,
    depositPayment,
    releasePayment,
    refundPayment,
    getPaymentForLot,
    refresh: fetchPayments,
    isConfigured: true,
  };
}

export { ESCROW_ADDRESS };
