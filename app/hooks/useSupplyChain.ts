import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { type Address } from "viem";

const CONTRACT_ADDRESS = "0xd5C0FB0f7D7f16d368a28CcbF5B1831b694E0490";

const CONTRACT_ABI = [
  { inputs: [{ name: "_title", type: "string" }, { name: "_description", type: "string" }, { name: "_quantity", type: "uint256" }, { name: "_unit", type: "string" }, { name: "_origin", type: "string" }, { name: "_stepDescriptions", type: "string[]" }, { name: "_stepValidators", type: "address[][]" }], name: "createLot", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }, { name: "_stepIndex", type: "uint256" }], name: "validateStep", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "nextLotId", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "getLot", outputs: [{ components: [{ name: "id", type: "uint256" }, { name: "creator", type: "address" }, { name: "createdAt", type: "uint64" }, { name: "quantity", type: "uint128" }, { name: "exists", type: "bool" }, { name: "title", type: "string" }, { name: "description", type: "string" }, { name: "unit", type: "string" }, { name: "origin", type: "string" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
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
      // Add timeout wrapper for RPC calls
      const nextId = await Promise.race([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "nextLotId",
        }) as Promise<bigint>,
        new Promise<bigint>((_, reject) => 
          setTimeout(() => reject(new Error("RPC timeout")), 20_000)
        )
      ]);

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
        })) as { id: bigint; creator: string; createdAt: bigint; quantity: bigint; exists: boolean; title: string; description: string; unit: string; origin: string };

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

        loadedLots.push({
          id: Number(lotData.id),
          title: lotData.title,
          description: lotData.description,
          quantity: Number(lotData.quantity),
          unit: lotData.unit,
          origin: lotData.origin,
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
