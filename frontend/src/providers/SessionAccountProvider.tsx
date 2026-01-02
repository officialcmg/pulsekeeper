"use client";

import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import { createContext, useState, useContext } from "react";
import { privateKeyToAccount, type Address } from "viem/accounts";
import { usePublicClient } from "wagmi";

// Backend session account address - this is the EIP-7702 upgraded account that will redeem permissions
// IMPORTANT: This must match the address derived from SESSION_PRIVATE_KEY in backend/.env
export const BACKEND_SESSION_ACCOUNT_ADDRESS: Address = "0x0ECB4898FA0D5793f81D04248206cE5392cd850A";

interface SessionAccountContext {
  sessionAccount: MetaMaskSmartAccount | null,
  sessionAccountAddress: Address,
  createSessionAccount: () => Promise<void>,
  isLoading: boolean,
  error: string | null,
}

export const SessionAccountContext = createContext<SessionAccountContext>({
  sessionAccount: null,
  sessionAccountAddress: BACKEND_SESSION_ACCOUNT_ADDRESS,
  createSessionAccount: async () => { },
  isLoading: false,
  error: null,
});

export const SessionAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sessionAccount, setSessionAccount] = useState<MetaMaskSmartAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  // The session account address is always the backend's address
  // We don't need to create a smart account here - the backend does that
  // We just need the address for permission requests
  const createSessionAccount = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!publicClient) {
        throw new Error("Public client not found");
      }

      // For EIP-7702, we use Stateless7702 implementation
      // The backend's EOA has already been upgraded to a smart account
      // We create a "dummy" smart account object just to satisfy the type system
      // The actual signing happens on the backend
      const newSessionAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Stateless7702,
        address: BACKEND_SESSION_ACCOUNT_ADDRESS,
        // No signer needed here - backend will sign
        signer: { account: privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001") },
      });

      setSessionAccount(newSessionAccount);
    } catch (err) {
      console.error("Error creating a session account:", err);
      setError(err instanceof Error ? err.message : "Failed to create a session account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionAccountContext.Provider
      value={{
        sessionAccount,
        sessionAccountAddress: BACKEND_SESSION_ACCOUNT_ADDRESS,
        createSessionAccount,
        isLoading,
        error,
      }}
    >
      {children}
    </SessionAccountContext.Provider>
  );
};

export const useSessionAccount = () => {
  return useContext(SessionAccountContext);
};