"use client";

import { ReactNode, useMemo } from "react";
import {
  ApolloClient,
  InMemoryCache,
  split,
  HttpLink,
} from "@apollo/client";
import { ApolloProvider as BaseApolloProvider } from "@apollo/client/react";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "";

// Convert HTTP URL to WebSocket URL for subscriptions
const getWsUrl = (httpUrl: string) => {
  return httpUrl.replace("https://", "wss://").replace("http://", "ws://");
};

export function ApolloProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    // HTTP link for queries and mutations
    const httpLink = new HttpLink({
      uri: INDEXER_URL,
    });

    // WebSocket link for subscriptions
    const wsLink =
      typeof window !== "undefined"
        ? new GraphQLWsLink(
            createClient({
              url: getWsUrl(INDEXER_URL),
              connectionParams: {},
              retryAttempts: 5,
              shouldRetry: () => true,
            })
          )
        : null;

    // Split link - use WebSocket for subscriptions, HTTP for everything else
    const splitLink =
      typeof window !== "undefined" && wsLink
        ? split(
            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
              );
            },
            wsLink,
            httpLink
          )
        : httpLink;

    return new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "cache-and-network",
        },
      },
    });
  }, []);

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
