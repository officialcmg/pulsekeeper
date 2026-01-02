"use client";

import { useState } from "react";
import { Address } from "viem";
import { useEnsResolver, ResolvedAddress } from "@/hooks/useEnsResolver";
import { Loader2, Plus, X, User, AlertCircle } from "lucide-react";
import Image from "next/image";

export interface Backup {
  address: Address;
  displayName: string;
  avatar: string | null;
  allocationBps: number; // Basis points (100 = 1%)
}

interface BackupAddressesProps {
  backups: Backup[];
  onBackupsChange: (backups: Backup[]) => void;
}

export default function BackupAddresses({
  backups,
  onBackupsChange,
}: BackupAddressesProps) {
  const [input, setInput] = useState("");
  const { resolveAddress, isResolving, error, clearError } = useEnsResolver();

  const totalAllocation = backups.reduce((sum, b) => sum + b.allocationBps, 0);
  const remainingAllocation = 10000 - totalAllocation;

  const handleAddBackup = async () => {
    if (!input.trim()) return;

    clearError();
    const resolved = await resolveAddress(input.trim());

    if (!resolved) return;

    // Check if already added
    if (backups.find((b) => b.address.toLowerCase() === resolved.address.toLowerCase())) {
      return;
    }

    // Default allocation: split remaining equally or give all remaining
    const defaultAllocation = Math.min(
      remainingAllocation,
      Math.floor(remainingAllocation / (backups.length === 0 ? 1 : 1))
    );

    onBackupsChange([
      ...backups,
      {
        address: resolved.address,
        displayName: resolved.displayName,
        avatar: resolved.avatar,
        allocationBps: defaultAllocation > 0 ? defaultAllocation : 0,
      },
    ]);
    setInput("");
  };

  const handleRemoveBackup = (address: Address) => {
    onBackupsChange(backups.filter((b) => b.address !== address));
  };

  const handleAllocationChange = (address: Address, bps: number) => {
    onBackupsChange(
      backups.map((b) =>
        b.address === address ? { ...b, allocationBps: Math.min(10000, Math.max(0, bps)) } : b
      )
    );
  };

  const handleEqualSplit = () => {
    if (backups.length === 0) return;
    const equalShare = Math.floor(10000 / backups.length);
    const remainder = 10000 - equalShare * backups.length;

    onBackupsChange(
      backups.map((b, i) => ({
        ...b,
        allocationBps: equalShare + (i === 0 ? remainder : 0),
      }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Backup Addresses
        </h3>
        {backups.length > 1 && (
          <button
            onClick={handleEqualSplit}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Split equally
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Add the addresses that will receive your funds if you go inactive. Supports ENS names (.eth, .base.eth, etc.)
      </p>

      {/* Add Backup Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              clearError();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAddBackup()}
            placeholder="vitalik.eth or 0x..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
          />
          {isResolving && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          )}
        </div>
        <button
          onClick={handleAddBackup}
          disabled={isResolving || !input.trim()}
          className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Backup List */}
      {backups.length > 0 && (
        <div className="space-y-3">
          {backups.map((backup) => (
            <div
              key={backup.address}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
                  {backup.avatar ? (
                    <Image
                      src={backup.avatar}
                      alt={backup.displayName}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {backup.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {backup.address}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveBackup(backup.address)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Allocation:
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={backup.allocationBps}
                  onChange={(e) =>
                    handleAllocationChange(backup.address, parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={(backup.allocationBps / 100).toFixed(0)}
                    onChange={(e) =>
                      handleAllocationChange(
                        backup.address,
                        parseFloat(e.target.value) * 100
                      )
                    }
                    className="w-16 px-2 py-1 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400">%</span>
                </div>
              </div>
            </div>
          ))}

          {/* Allocation Summary */}
          <div
            className={`p-3 rounded-lg ${
              totalAllocation === 10000
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : totalAllocation > 10000
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  totalAllocation === 10000
                    ? "text-green-700 dark:text-green-300"
                    : totalAllocation > 10000
                    ? "text-red-700 dark:text-red-300"
                    : "text-yellow-700 dark:text-yellow-300"
                }`}
              >
                Total Allocation: {(totalAllocation / 100).toFixed(0)}%
              </span>
              {totalAllocation !== 10000 && (
                <span
                  className={`text-sm ${
                    totalAllocation > 10000
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {totalAllocation > 10000
                    ? `${((totalAllocation - 10000) / 100).toFixed(0)}% over`
                    : `${((10000 - totalAllocation) / 100).toFixed(0)}% remaining`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {backups.length === 0 && (
        <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <User className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            No backup addresses added yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Add ENS names or wallet addresses above
          </p>
        </div>
      )}
    </div>
  );
}
