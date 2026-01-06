import { useState, useEffect, useCallback } from "react";
import { useAccount, useSendTransaction, useWriteContract, usePublicClient } from "wagmi";
import { formatEther, encodeFunctionData } from "viem";

const ESCROW_ADDRESS = "0x6Cf8fE211D0A02821e36e43eDD5f016A1Ab3f57e";

const ESCROW_ABI = [
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "depositPayment", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "releasePayment", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "refundPayment", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "getPayment", outputs: [{ components: [{ name: "lotId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "seller", type: "address" }, { name: "amount", type: "uint256" }, { name: "createdAt", type: "uint256" }, { name: "releasedAt", type: "uint256" }, { name: "released", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPaymentsCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_index", type: "uint256" }], name: "getPaymentByIndex", outputs: [{ components: [{ name: "lotId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "seller", type: "address" }, { name: "amount", type: "uint256" }, { name: "createdAt", type: "uint256" }, { name: "releasedAt", type: "uint256" }, { name: "released", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "isLotCompleted", outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getContractBalance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "address" }], name: "totalReceived", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "address" }], name: "totalSpent", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "getLotPrice", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
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
  const { sendTransactionAsync } = useSendTransaction();
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
    
    // Encode function data
    const data = encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: "depositPayment",
      args: [BigInt(lotId)],
    });
    
    // Force a very conservative gas limit (8M - well under 16.7M limit)
    const gasLimit = BigInt(8_000_000);
    
    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();
    
    // Use sendTransaction with explicit gas limit
    // Use type: 0 (legacy) to force MetaMask to use our gas limit
    const hash = await sendTransactionAsync({
      to: ESCROW_ADDRESS,
      data,
      value: priceWei,
      gas: gasLimit,
      gasPrice: gasPrice,
      type: "legacy", // Force legacy transaction type
    } as any);
    
    await waitForReceipt(hash);
    await fetchPayments();
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
