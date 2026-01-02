"use client";

import { useEffect, useState } from "react";
import { Address, formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { SEPOLIA_TOKENS, NATIVE_ETH, Token, ERC20_ABI } from "@/constants/tokens";

export interface TokenWithBalance extends Token {
  balance: bigint;
  formattedBalance: string;
}

export function useTokenBalances() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [tokens, setTokens] = useState<TokenWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !publicClient) return;

      setIsLoading(true);
      setError(null);

      try {
        const tokensWithBalances: TokenWithBalance[] = [];

        // Fetch native ETH balance
        const ethBalance = await publicClient.getBalance({ address });
        tokensWithBalances.push({
          ...NATIVE_ETH,
          balance: ethBalance,
          formattedBalance: formatUnits(ethBalance, 18),
        });

        // Fetch ERC20 token balances
        for (const token of SEPOLIA_TOKENS) {
          try {
            const balance = await publicClient.readContract({
              address: token.address as Address,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address],
            });

            tokensWithBalances.push({
              ...token,
              balance: balance as bigint,
              formattedBalance: formatUnits(balance as bigint, token.decimals),
            });
          } catch (err) {
            // Token might not exist on this network, skip it
            console.warn(`Failed to fetch balance for ${token.symbol}:`, err);
          }
        }

        setTokens(tokensWithBalances);
      } catch (err) {
        console.error("Error fetching token balances:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch balances");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [address, publicClient]);

  // Filter to only show tokens with non-zero balance
  const tokensWithBalance = tokens.filter((t) => t.balance > 0n);

  return {
    tokens,
    tokensWithBalance,
    isLoading,
    error,
    refetch: () => {
      if (address && publicClient) {
        setTokens([]);
      }
    },
  };
}
