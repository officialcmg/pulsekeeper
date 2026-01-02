"use client";

import { useState } from "react";
import { Hex, parseUnits } from "viem";
import { pimlicoClientFactory } from "@/services/pimlicoClient";
import { bundlerClientFactory } from "@/services/bundlerClient";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { Loader2, Zap, ExternalLink, AlertTriangle, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import { useAccount, usePublicClient } from "wagmi";
import { Backup } from "./BackupAddresses";
import { TokenAllowance } from "./TokenSelector";
import { NATIVE_ETH } from "@/constants/tokens";

interface RedeemTestProps {
  backups: Backup[];
  tokenAllowances: TokenAllowance[];
}

/**
 * TEMPORARY COMPONENT - Remove after testing
 * This component tests permission redemption by sending tokens to backup addresses
 */
export default function RedeemTest({ backups, tokenAllowances }: RedeemTestProps) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sessionAccount } = useSessionAccount();
  const { permission } = usePermissions();
  const publicClient = usePublicClient();
  const { chain, address } = useAccount();

  const handleTestRedeem = async () => {
    if (!permission || !chain || !publicClient || !sessionAccount || !address) {
      setError("Missing required data for redemption");
      return;
    }

    if (backups.length === 0) {
      setError("No backup addresses configured");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { context, signerMeta } = permission;

      if (!signerMeta) {
        throw new Error("No signer meta found in permission");
      }

      const { delegationManager } = signerMeta;

      if (!context || !delegationManager) {
        throw new Error("Missing required parameters for delegation");
      }

      const pimlicoClient = pimlicoClientFactory(chain.id);
      const bundlerClient = bundlerClientFactory(chain.id);

      const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

      // Build calls for each backup based on their allocation
      // For testing, we'll send a small amount to each backup
      const calls = backups.map((backup) => {
        // Send 0.0001 ETH to each backup for testing (scaled by allocation)
        const testAmount = BigInt(Math.floor(100000000000000 * (backup.allocationBps / 10000))); // 0.0001 ETH * allocation %
        
        return {
          to: backup.address,
          data: "0x" as Hex,
          value: testAmount,
          permissionsContext: context,
          delegationManager,
        };
      });

      console.log("Sending test redemption to backups:", calls);

      const hash = await bundlerClient.sendUserOperationWithDelegation({
        publicClient,
        account: sessionAccount,
        calls,
        ...fee,
      });

      const { receipt } = await bundlerClient.waitForUserOperationReceipt({
        hash,
      });

      setTxHash(receipt.transactionHash);
      console.log("Redemption successful:", receipt);
    } catch (err) {
      console.error("Redemption error:", err);
      setError(err instanceof Error ? err.message : "Failed to redeem permission");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
          🧪 Test Permission Redemption
        </h3>
        <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">
          DEV ONLY
        </span>
      </div>

      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
        This tests the permission by sending a tiny amount (0.0001 ETH total, split by allocation) to your backup addresses.
        <br />
        <span className="font-medium">This component will be removed before production.</span>
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {txHash && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
            ✅ Test redemption successful!
          </p>
          <a
            href={`${chain?.blockExplorers?.default?.url}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            View transaction <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleTestRedeem}
          disabled={loading || backups.length === 0}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Test Redeem Permission
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
        <p>Will send to:</p>
        <ul className="list-disc list-inside">
          {backups.map((b) => (
            <li key={b.address}>
              {b.displayName}: {(0.0001 * (b.allocationBps / 10000)).toFixed(6)} ETH
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
