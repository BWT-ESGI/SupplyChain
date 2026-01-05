import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { type Address } from "viem";

const CONTRACT_ADDRESS = "0x286A15f6fd612b8105F867aCB69Fb74Bf34e73A1";

const CONTRACT_ABI = [
  { inputs: [{ name: "_title", type: "string" }, { name: "_description", type: "string" }, { name: "_stepDescriptions", type: "string[]" }, { name: "_stepValidators", type: "address[][]" }], name: "createLot", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }, { name: "_stepIndex", type: "uint256" }], name: "validateStep", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "nextLotId", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_lotId", type: "uint256" }], name: "getLot", outputs: [{ components: [{ name: "id", type: "uint256" }, { name: "title", type: "string" }, { name: "description", type: "string" }, { name: "creator", type: "address" }, { name: "createdAt", type: "uint256" }, { name: "exists", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
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
  creator: string;
  createdAt: number;
  steps: Step[];
};

export function useSupplyChain() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);

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
      const start = Math.max(0, count - 10);

      for (let i = count - 1; i >= start; i--) {
        const lotId = BigInt(i);
        const lotData = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getLot",
          args: [lotId],
        })) as { id: bigint; title: string; description: string; creator: string; createdAt: bigint; exists: boolean };

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

  const createLot = async (title: string, description: string, stepDescs: string[], stepValidators: string[][]) => {
    if (!address) throw new Error("Not connected");
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createLot",
      args: [title, description, stepDescs, stepValidators as Address[][]],
    });
    await publicClient?.waitForTransactionReceipt({ hash });
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
    await publicClient?.waitForTransactionReceipt({ hash });
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
