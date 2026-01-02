"use client";

import { useAccount, useDisconnect, useBalance } from "wagmi";
import { Heart, LogOut, Wallet, ExternalLink } from "lucide-react";
import { formatEther } from "viem";

export default function Header() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const viewOnEtherscan = () => {
    if (address && chain?.blockExplorers?.default?.url) {
      window.open(`${chain.blockExplorers.default.url}/address/${address}`, "_blank");
    }
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 max-w-4xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Pulse<span className="text-primary-500">Keeper</span>
            </span>
          </div>

          {/* Wallet Info */}
          {isConnected && address && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Wallet className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button
                  onClick={viewOnEtherscan}
                  className="text-gray-400 hover:text-primary-500 transition-colors"
                  title="View on Etherscan"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
              
              {balance && (
                <div className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                  {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                </div>
              )}

              <button
                onClick={() => disconnect()}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Disconnect"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
