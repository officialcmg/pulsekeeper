"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "viem/chains";
import { ReactNode } from "react";
import { metaMask } from "wagmi/connectors";
import { PermissionProvider } from "@/providers/PermissionProvider";
import { SessionAccountProvider } from "@/providers/SessionAccountProvider";
import { PulseKeeperProvider } from "@/providers/PulseKeeperProvider";
import { ApolloProvider } from "@/providers/ApolloProvider";

export const connectors = [metaMask()];

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
    chains: [sepolia],
    connectors,
    multiInjectedProviderDiscovery: false,
    ssr: true,
    transports: {
        [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    },
});

export function AppProvider({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>
                <ApolloProvider>
                    <SessionAccountProvider>
                        <PermissionProvider>
                            <PulseKeeperProvider>
                                {children}
                            </PulseKeeperProvider>
                        </PermissionProvider>
                    </SessionAccountProvider>
                </ApolloProvider>
            </WagmiProvider>
        </QueryClientProvider>
    );
}