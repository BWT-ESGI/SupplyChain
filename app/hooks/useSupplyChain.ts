import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { type Address, parseEther } from "viem";

const CONTRACT_ADDRESS = "0x06EA553Fd3478178A45644183A17c5A5b74444fb";

const CONTRACT_ABI = [
  { inputs: [{ name: "_title", type: "string" }, { name: "_description", type: "string" }, { name: "_quantity", type: "uint256" }, { name: "_unit", type: "string" }, { name: "_origin", type: "string" }, { name: "_price", type: "uint256" }, { name: "_stepDescriptions", type: "string[]" }, { name: "_stepValidators", type: "address[][]" }], name: "createLot", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }, { name: "_stepIndex", type: "uint256" }], name: "validateStep", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "nextLotId", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "getLot", outputs: [{ components: [{ name: "id", type: "uint256" }, { name: "title", type: "string" }, { name: "description", type: "string" }, { name: "quantity", type: "uint256" }, { name: "unit", type: "string" }, { name: "origin", type: "string" }, { name: "price", type: "uint256" }, { name: "creator", type: "address" }, { name: "createdAt", type: "uint256" }, { name: "exists", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "getLotStepsCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }, { name: "_stepIndex", type: "uint256" }], name: "getStep", outputs: [{ name: "description", type: "string" }, { name: "validators", type: "address[]" }, { name: "validatedBy", type: "address" }, { name: "validatedAt", type: "uint256" }, { name: "status", type: "uint8" }], stateMutability: "view", type: "function" }
] as const;

export type Step = {
  description: string;
  validators: string[];
  validatedBy: string;
  validatedAt: number;
  status: number;
};

export type Lot = {
  id: number;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  origin: string;
  price: string;
  priceWei: bigint;
  creator: string;
  createdAt: number;
  steps: Step[];
};

export type CreateLotParams = {
  title: string;
  description: string;
  quantity: number;
  unit: string;
  origin: string;
  priceEth: string;
  stepDescriptions: string[];
  stepValidators: string[][];
};

export function useSupplyChain() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [lots, setLots] = useState<Lot[]>([]);
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

  const fetchLots = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      const nextId = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "nextLotId",
      })) as bigint;

      const loadedLots: Lot[] = [];
      const count = Number(nextId);
      const start = Math.max(0, count - 20);

      for (let i = count - 1; i >= start; i--) {
        const lotId = BigInt(i);
        const lotData = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getLot",
          args: [lotId],
        })) as { id: bigint; title: string; description: string; quantity: bigint; unit: string; origin: string; price: bigint; creator: string; createdAt: bigint; exists: boolean };

        if (!lotData.exists) continue;

        const stepsCount = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getLotStepsCount",
          args: [lotId],
        })) as bigint;

        const steps: Step[] = [];
        for (let j = 0; j < Number(stepsCount); j++) {
          const s = (await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getStep",
            args: [lotId, BigInt(j)],
          })) as [string, string[], string, bigint, number];

          steps.push({
            description: s[0],
            validators: s[1],
            validatedBy: s[2],
            validatedAt: Number(s[3]),
            status: s[4],
          });
        }

        const priceInEth = Number(lotData.price) / 1e18;

        loadedLots.push({
          id: Number(lotData.id),
          title: lotData.title,
          description: lotData.description,
          quantity: Number(lotData.quantity),
          unit: lotData.unit,
          origin: lotData.origin,
          price: priceInEth.toString(),
          priceWei: lotData.price,
          creator: lotData.creator,
          createdAt: Number(lotData.createdAt),
          steps,
        });
      }
      setLots(loadedLots);
    } catch (e) {
      console.error("Error fetching lots", e);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  const createLot = async (params: CreateLotParams) => {
    if (!address) throw new Error("Not connected");
    const priceWei = parseEther(params.priceEth || "0");
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createLot",
      args: [
        params.title,
        params.description,
        BigInt(params.quantity),
        params.unit,
        params.origin,
        priceWei,
        params.stepDescriptions,
        params.stepValidators as Address[][],
      ],
    });
    await waitForReceipt(hash);
    await fetchLots();
  };

  const validateStep = async (lotId: number, stepIndex: number) => {
    if (!address) throw new Error("Not connected");
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "validateStep",
      args: [BigInt(lotId), BigInt(stepIndex)],
    });
    await waitForReceipt(hash);
    await fetchLots();
  };

  useEffect(() => {
    if (publicClient) fetchLots();
  }, [publicClient, fetchLots]);

  return {
    account: address,
    isConnected,
    lots,
    loading,
    createLot,
    validateStep,
    refresh: fetchLots,
  };
}
