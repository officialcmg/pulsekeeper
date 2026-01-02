"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useTokenBalances, TokenWithBalance } from "@/hooks/useTokenBalances";
import { Loader2, Check, Plus, X, Coins } from "lucide-react";
import Image from "next/image";

export interface TokenAllowance {
  token: TokenWithBalance;
  amount: string;
  periodDays: number;
}

interface TokenSelectorProps {
  selectedTokens: TokenAllowance[];
  onTokensChange: (tokens: TokenAllowance[]) => void;
}

export default function TokenSelector({
  selectedTokens,
  onTokensChange,
}: TokenSelectorProps) {
  const { tokensWithBalance, isLoading, error } = useTokenBalances();
  const [showTokenList, setShowTokenList] = useState(false);

  const handleAddToken = (token: TokenWithBalance) => {
    if (selectedTokens.find((t) => t.token.address === token.address)) {
      return; // Already selected
    }
    onTokensChange([
      ...selectedTokens,
      { token, amount: "", periodDays: 7 },
    ]);
    setShowTokenList(false);
  };

  const handleRemoveToken = (address: string) => {
    onTokensChange(selectedTokens.filter((t) => t.token.address !== address));
  };

  const handleAmountChange = (address: string, amount: string) => {
    onTokensChange(
      selectedTokens.map((t) =>
        t.token.address === address ? { ...t, amount } : t
      )
    );
  };

  const handlePeriodChange = (address: string, periodDays: number) => {
    onTokensChange(
      selectedTokens.map((t) =>
        t.token.address === address ? { ...t, periodDays } : t
      )
    );
  };

  const availableTokens = tokensWithBalance.filter(
    (t) => !selectedTokens.find((s) => s.token.address === t.address)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading token balances...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (tokensWithBalance.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
        <Coins className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No tokens with balance found in your wallet.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Make sure you have some tokens on Sepolia testnet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select Tokens for Protection
        </h3>
        {availableTokens.length > 0 && (
          <button
            onClick={() => setShowTokenList(!showTokenList)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Token
          </button>
        )}
      </div>

      {/* Token Selection Dropdown */}
      {showTokenList && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Available Tokens
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {availableTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleAddToken(token)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <Image
                    src={token.icon}
                    alt={token.symbol}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {token.symbol}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {token.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {parseFloat(token.formattedBalance).toFixed(4)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Tokens */}
      {selectedTokens.length > 0 && (
        <div className="space-y-3">
          {selectedTokens.map(({ token, amount, periodDays }) => (
            <div
              key={token.address}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <Image
                    src={token.icon}
                    alt={token.symbol}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {token.symbol}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Balance: {parseFloat(token.formattedBalance).toFixed(4)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveToken(token.address)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount per period
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) =>
                        handleAmountChange(token.address, e.target.value)
                      }
                      placeholder="0.00"
                      min="0"
                      step="any"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {token.symbol}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Period (days)
                  </label>
                  <select
                    value={periodDays}
                    onChange={(e) =>
                      handlePeriodChange(token.address, parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              </div>

              {amount && (
                <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    <span className="font-medium">Flow rate:</span>{" "}
                    {(parseFloat(amount) / periodDays).toFixed(4)} {token.symbol}
                    /day
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTokens.length === 0 && !showTokenList && (
        <button
          onClick={() => setShowTokenList(true)}
          className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
              Click to add tokens for protection
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
