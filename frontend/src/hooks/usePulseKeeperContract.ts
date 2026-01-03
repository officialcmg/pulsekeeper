"use client";

import { useCallback, useMemo } from "react";
import { Address, encodeFunctionData, http } from "viem";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { createBundlerClient } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
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
  const chainId = useChainId();

  // Create Pimlico client for gas estimation
  const pimlicoClient = useMemo(() => {
    const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
    if (!pimlicoKey) return null;
    
    return createPimlicoClient({
      transport: http(`https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`),
    });
  }, [chainId]);

  // Create bundler client with paymaster for gas sponsorship
  const bundlerClient = useMemo(() => {
    const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
    if (!pimlicoKey || !publicClient) return null;

    return createBundlerClient({
      client: publicClient,
      transport: http(`https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`),
      paymaster: true, // Enable gas sponsorship
    });
  }, [chainId, publicClient]);

  // Convert frontend Backup type to contract BackupStruct
  const toBackupStruct = (backup: Backup): BackupStruct => ({
    addr: backup.address,
    allocationBps: backup.allocationBps,
  });

  // Helper to get gas prices from Pimlico
  const getGasPrices = useCallback(async () => {
    if (!pimlicoClient) {
      // Fallback to reasonable defaults
      return {
        maxFeePerGas: 50000000000n, // 50 gwei
        maxPriorityFeePerGas: 5000000000n, // 5 gwei
      };
    }
    
    const { fast } = await pimlicoClient.getUserOperationGasPrice();
    return fast;
  }, [pimlicoClient]);

  // Helper to create smart account from connected wallet
  const getSmartAccount = useCallback(async () => {
    if (!walletClient || !publicClient || !address) {
      throw new Error("Wallet not connected");
    }

    // Create a MetaMask smart account using the connected wallet
    // For EIP-7702, the user's EOA is upgraded to a smart account
    // Use WalletSignerConfig which expects a walletClient
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Stateless7702,
      address: address,
      signer: { 
        walletClient: walletClient,
      },
    });

    return smartAccount;
  }, [walletClient, publicClient, address]);

  // Register user with initial configuration using smart account
  const register = useCallback(
    async (pulsePeriodSeconds: number, backups: Backup[]) => {
      if (!bundlerClient || !walletClient || !address) {
        throw new Error("Wallet or bundler not connected");
      }

      const backupStructs = backups.map(toBackupStruct);
      const smartAccount = await getSmartAccount();
      const fee = await getGasPrices();

      // Encode the contract call
      const callData = encodeFunctionData({
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "register",
        args: [BigInt(pulsePeriodSeconds), backupStructs],
      });

      // Send user operation with gas sponsorship
      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [{
          to: PULSEKEEPER_REGISTRY_ADDRESS,
          data: callData,
        }],
        ...fee,
      });

      // Wait for receipt
      const { receipt } = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      return receipt.transactionHash;
    },
    [bundlerClient, walletClient, address, getSmartAccount, getGasPrices]
  );

  // Set backups on the contract using smart account
  const setBackups = useCallback(
    async (backups: Backup[]) => {
      if (!bundlerClient || !walletClient || !address) {
        throw new Error("Wallet or bundler not connected");
      }

      const backupStructs = backups.map(toBackupStruct);
      const smartAccount = await getSmartAccount();
      const fee = await getGasPrices();

      const callData = encodeFunctionData({
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "setBackups",
        args: [backupStructs],
      });

      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [{
          to: PULSEKEEPER_REGISTRY_ADDRESS,
          data: callData,
        }],
        ...fee,
      });

      const { receipt } = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      return receipt.transactionHash;
    },
    [bundlerClient, walletClient, address, getSmartAccount, getGasPrices]
  );

  // Check in to reset the timer using smart account
  const checkIn = useCallback(async () => {
    if (!bundlerClient || !walletClient || !address) {
      throw new Error("Wallet or bundler not connected");
    }

    const smartAccount = await getSmartAccount();
    const fee = await getGasPrices();

    const callData = encodeFunctionData({
      abi: PULSEKEEPER_REGISTRY_ABI,
      functionName: "checkIn",
      args: [],
    });

    const userOpHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [{
        to: PULSEKEEPER_REGISTRY_ADDRESS,
        data: callData,
      }],
      ...fee,
    });

    const { receipt } = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    return receipt.transactionHash;
  }, [bundlerClient, walletClient, address, getSmartAccount, getGasPrices]);

  // Set pulse period using smart account
  const setPulsePeriod = useCallback(
    async (pulsePeriodSeconds: number) => {
      if (!bundlerClient || !walletClient || !address) {
        throw new Error("Wallet or bundler not connected");
      }

      const smartAccount = await getSmartAccount();
      const fee = await getGasPrices();

      const callData = encodeFunctionData({
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: "setPulsePeriod",
        args: [BigInt(pulsePeriodSeconds)],
      });

      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [{
          to: PULSEKEEPER_REGISTRY_ADDRESS,
          data: callData,
        }],
        ...fee,
      });

      const { receipt } = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      return receipt.transactionHash;
    },
    [bundlerClient, walletClient, address, getSmartAccount, getGasPrices]
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
