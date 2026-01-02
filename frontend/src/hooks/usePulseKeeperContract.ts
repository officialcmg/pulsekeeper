"use client";

import { useCallback } from "react";
import { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  PULSEKEEPER_REGISTRY_ADDRESS,
  PULSEKEEPER_REGISTRY_ABI,
  BackupStruct,
} from "@/constants/contracts";
import { Backup } from "@/components/BackupAddresses";

export function usePulseKeeperContract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Convert frontend Backup type to contract BackupStruct
  const toBackupStruct = (backup: Backup): BackupStruct => ({
    addr: backup.address,
    allocationBps: backup.allocationBps,
  });

  // Register user with initial configuration
  const register = useCallback(
    async (pulsePeriodDays: number, backups: Backup[]) => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      const backupStructs = backups.map(toBackupStruct);

      const hash = await walletClient.writeContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "register",
        args: [BigInt(pulsePeriodDays), backupStructs],
      });

      return hash;
    },
    [walletClient, address]
  );

  // Set backups on the contract
  const setBackups = useCallback(
    async (backups: Backup[]) => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      const backupStructs = backups.map(toBackupStruct);

      const hash = await walletClient.writeContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "setBackups",
        args: [backupStructs],
      });

      return hash;
    },
    [walletClient, address]
  );

  // Check in to reset the timer
  const checkIn = useCallback(async () => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    const hash = await walletClient.writeContract({
      address: PULSEKEEPER_REGISTRY_ADDRESS,
      abi: PULSEKEEPER_REGISTRY_ABI,
      functionName: "checkIn",
      args: [],
    });

    return hash;
  }, [walletClient, address]);

  // Set pulse period
  const setPulsePeriod = useCallback(
    async (pulsePeriodDays: number) => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      const hash = await walletClient.writeContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "setPulsePeriod",
        args: [BigInt(pulsePeriodDays)],
      });

      return hash;
    },
    [walletClient, address]
  );

  // Get last check-in timestamp
  const getLastCheckIn = useCallback(
    async (userAddress?: Address) => {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const targetAddress = userAddress || address;
      if (!targetAddress) {
        throw new Error("No address provided");
      }

      const timestamp = await publicClient.readContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "getLastCheckIn",
        args: [targetAddress],
      });

      return new Date(Number(timestamp) * 1000);
    },
    [publicClient, address]
  );

  // Get pulse period
  const getPulsePeriod = useCallback(
    async (userAddress?: Address) => {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const targetAddress = userAddress || address;
      if (!targetAddress) {
        throw new Error("No address provided");
      }

      const period = await publicClient.readContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "getPulsePeriod",
        args: [targetAddress],
      });

      return Number(period);
    },
    [publicClient, address]
  );

  // Check if user is active (not past deadline)
  const isActive = useCallback(
    async (userAddress?: Address) => {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const targetAddress = userAddress || address;
      if (!targetAddress) {
        throw new Error("No address provided");
      }

      const active = await publicClient.readContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "isActive",
        args: [targetAddress],
      });

      return active;
    },
    [publicClient, address]
  );

  // Check if distribution is happening
  const isDistributing = useCallback(
    async (userAddress?: Address) => {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const targetAddress = userAddress || address;
      if (!targetAddress) {
        throw new Error("No address provided");
      }

      const distributing = await publicClient.readContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "isDistributing",
        args: [targetAddress],
      });

      return distributing;
    },
    [publicClient, address]
  );

  return {
    register,
    setBackups,
    checkIn,
    setPulsePeriod,
    getLastCheckIn,
    getPulsePeriod,
    isActive,
    isDistributing,
    contractAddress: PULSEKEEPER_REGISTRY_ADDRESS,
  };
}
