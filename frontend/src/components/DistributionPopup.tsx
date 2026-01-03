"use client";

import { useState, useEffect } from "react";
import { X, Zap, ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";

// Token list with icons (matching the token selector)
const TOKEN_ICONS: Record<string, string> = {
  "0x0000000000000000000000000000000000000000": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  "0x779877a7b0d9e8603169ddbd7836e478b4624789": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png", // LINK
  "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // USDC
};

const TOKEN_SYMBOLS: Record<string, string> = {
  "0x0000000000000000000000000000000000000000": "ETH",
  "0x779877a7b0d9e8603169ddbd7836e478b4624789": "LINK",
  "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238": "USDC",
};

export interface Distribution {
  id: string;
  sender: string;
  redeemer: string;
  token: string;
  periodAmount: bigint;
  transferredInCurrentPeriod: bigint;
  transferTimestamp: bigint;
}

interface DistributionPopupProps {
  distribution: Distribution | null;
  onClose: () => void;
}

export function DistributionPopup({ distribution, onClose }: DistributionPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (distribution) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [distribution]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!distribution || !isVisible) return null;

  const tokenAddress = distribution.token?.toLowerCase() || "0x0000000000000000000000000000000000000000";
  const tokenIcon = TOKEN_ICONS[tokenAddress] || TOKEN_ICONS["0x0000000000000000000000000000000000000000"];
  const tokenSymbol = TOKEN_SYMBOLS[tokenAddress] || "TOKEN";
  
  // Format amount (assuming 18 decimals for most tokens)
  const decimals = tokenSymbol === "USDC" ? 6 : 18;
  const amount = Number(distribution.transferredInCurrentPeriod) / Math.pow(10, decimals);
  const formattedAmount = amount.toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ${isExiting ? 'animate-scale-out' : 'animate-scale-in'}`}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Distribution Complete!</h2>
              <p className="text-white/80">Funds transferred to backup</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl px-6 py-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <Image
                  src={tokenIcon}
                  alt={tokenSymbol}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formattedAmount}
                </p>
                <p className="text-gray-500 dark:text-gray-400">{tokenSymbol}</p>
              </div>
            </div>
          </div>

          {/* Flow Visualization */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                <span className="text-red-600 dark:text-red-400 font-bold">You</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                {distribution.sender?.slice(0, 6)}...{distribution.sender?.slice(-4)}
              </p>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="h-0.5 flex-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
              <ArrowRight className="h-6 w-6 text-green-500 mx-2" />
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                {distribution.redeemer?.slice(0, 6)}...{distribution.redeemer?.slice(-4)}
              </p>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <p className="text-green-700 dark:text-green-300 font-medium">
              Your backup has received the funds successfully!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
