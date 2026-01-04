"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ExternalLink, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/Button";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Redemption {
  id: number;
  userAddress: string;
  tokenAddress: string;
  amount: string;
  txHash: string;
  redeemedAt: string;
  periodStart: string;
}

export default function RedemptionsPage() {
  const { address, isConnected } = useAccount();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRedemptions = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/distribution/redemptions/${address}`);
      const data = await response.json();
      
      if (data.success) {
        setRedemptions(data.redemptions);
      } else {
        setError(data.error || "Failed to fetch redemptions");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchRedemptions();
    }
  }, [address]);

  const formatAmount = (amount: string, tokenAddress: string) => {
    const isNative = tokenAddress === "0x0000000000000000000000000000000000000000";
    const decimals = isNative ? 18 : 6; // Assume USDC/stablecoins are 6 decimals
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const fracPart = value % divisor;
    return `${intPart}.${fracPart.toString().padStart(decimals, "0").slice(0, 4)}`;
  };

  const getTokenName = (tokenAddress: string) => {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") return "ETH";
    if (tokenAddress.toLowerCase() === "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238") return "USDC";
    return `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold">Redemption History</h1>
          </div>
          <Button onClick={fetchRedemptions} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {!isConnected ? (
          <div className="text-center py-12 text-gray-500">
            Connect your wallet to view redemption history
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary-500" />
            <p className="mt-4 text-gray-500">Loading redemptions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        ) : redemptions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No redemptions found
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map((r) => (
              <div
                key={r.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold">
                        {formatAmount(r.amount, r.tokenAddress)} {getTokenName(r.tokenAddress)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(r.redeemedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Token: <span className="font-mono">{r.tokenAddress}</span>
                    </div>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${r.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <span className="font-mono text-sm">{r.txHash.slice(0, 10)}...</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
