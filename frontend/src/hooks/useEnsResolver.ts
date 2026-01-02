"use client";

import { useState, useCallback } from "react";
import { isAddress, Address } from "viem";

export interface ResolvedAddress {
  address: Address;
  name: string | null;
  displayName: string;
  avatar: string | null;
}

export function useEnsResolver() {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAddress = useCallback(
    async (input: string): Promise<ResolvedAddress | null> => {
      setIsResolving(true);
      setError(null);

      try {
        // If it's already a valid address, resolve it to get ENS name if any
        if (isAddress(input)) {
          try {
            const response = await fetch(
              `https://api.ensideas.com/ens/resolve/${input}`
            );
            if (response.ok) {
              const data = await response.json();
              return {
                address: data.address as Address,
                name: data.name || null,
                displayName: data.displayName || input.slice(0, 6) + "..." + input.slice(-4),
                avatar: data.avatar || null,
              };
            }
          } catch {
            // ENS lookup failed, return just the address
          }
          return {
            address: input as Address,
            name: null,
            displayName: input.slice(0, 6) + "..." + input.slice(-4),
            avatar: null,
          };
        }

        // Try to resolve as ENS name
        const response = await fetch(
          `https://api.ensideas.com/ens/resolve/${input}`
        );

        if (!response.ok) {
          throw new Error("Could not resolve ENS name");
        }

        const data = await response.json();

        if (!data.address) {
          throw new Error("ENS name not found");
        }

        return {
          address: data.address as Address,
          name: data.name || input,
          displayName: data.displayName || input,
          avatar: data.avatar || null,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to resolve address";
        setError(message);
        return null;
      } finally {
        setIsResolving(false);
      }
    },
    []
  );

  return {
    resolveAddress,
    isResolving,
    error,
    clearError: () => setError(null),
  };
}
