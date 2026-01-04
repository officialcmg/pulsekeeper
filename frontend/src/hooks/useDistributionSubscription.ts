"use client";

import { gql } from "@apollo/client";
import { useSubscription } from "@apollo/client/react";
import { useCallback, useState, useEffect } from "react";
import { Distribution } from "@/components/DistributionPopup";

// Subscription for latest check-in
const LATEST_CHECKIN_SUBSCRIPTION = gql`
  subscription LatestCheckIn($user: String!) {
    PulseKeeperRegistry_CheckIn(
      where: { user: { _eq: $user } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      id
      user
      timestamp
      deadline
    }
  }
`;

// Subscription for user registration (to check if registered + get initial timestamp)
const USER_REGISTRATION_SUBSCRIPTION = gql`
  subscription UserRegistration($user: String!) {
    PulseKeeperRegistry_UserRegistered(
      where: { user: { _eq: $user } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      id
      user
      pulsePeriodSeconds
      timestamp
      deadline
    }
  }
`;

export interface CheckInData {
  timestamp: bigint;
  deadline: bigint;
}

export interface RegistrationData {
  isRegistered: boolean;
  pulsePeriodSeconds: bigint;
  timestamp: bigint;
  deadline: bigint;
}

export function useCheckInSubscription(userAddress: string | undefined) {
  const [latestCheckIn, setLatestCheckIn] = useState<CheckInData | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);

  // Subscribe to check-ins
  const { loading: checkInLoading } = useSubscription(
    LATEST_CHECKIN_SUBSCRIPTION,
    {
      variables: { user: userAddress?.toLowerCase() || "" },
      skip: !userAddress,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onData: ({ data }: any) => {
        const checkIn = data?.data?.PulseKeeperRegistry_CheckIn?.[0];
        if (checkIn) {
          setLatestCheckIn({
            timestamp: BigInt(checkIn.timestamp),
            deadline: BigInt(checkIn.deadline),
          });
        }
      },
    }
  );

  // Subscribe to registration
  const { loading: registrationLoading } = useSubscription(
    USER_REGISTRATION_SUBSCRIPTION,
    {
      variables: { user: userAddress?.toLowerCase() || "" },
      skip: !userAddress,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onData: ({ data }: any) => {
        const reg = data?.data?.PulseKeeperRegistry_UserRegistered?.[0];
        if (reg) {
          setRegistration({
            isRegistered: true,
            pulsePeriodSeconds: BigInt(reg.pulsePeriodSeconds),
            timestamp: BigInt(reg.timestamp),
            deadline: BigInt(reg.deadline),
          });
        }
      },
    }
  );

  // If no check-in but registered, use registration timestamp as initial check-in
  const effectiveCheckIn = latestCheckIn || (registration ? {
    timestamp: registration.timestamp,
    deadline: registration.deadline,
  } : null);

  return {
    latestCheckIn: effectiveCheckIn,
    registration,
    isRegistered: !!registration,
    loading: checkInLoading || registrationLoading,
  };
}

// Subscription for ERC20 distributions - no filter, show all recent
const ERC20_DISTRIBUTION_SUBSCRIPTION = gql`
  subscription ERC20Distributions {
    ERC20PeriodTransferEnforcer_TransferredInPeriod(
      order_by: { transferTimestamp: desc }
      limit: 1
    ) {
      id
      sender
      redeemer
      token
      periodAmount
      transferredInCurrentPeriod
      transferTimestamp
    }
  }
`;

// Subscription for Native token distributions - no filter, show all recent
const NATIVE_DISTRIBUTION_SUBSCRIPTION = gql`
  subscription NativeDistributions {
    NativeTokenPeriodTransferEnforcer_TransferredInPeriod(
      order_by: { transferTimestamp: desc }
      limit: 1
    ) {
      id
      sender
      redeemer
      periodAmount
      transferredInCurrentPeriod
      transferTimestamp
    }
  }
`;

export function useDistributionSubscription(userAddress: string | undefined) {
  const [latestDistribution, setLatestDistribution] = useState<Distribution | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const handleNewDistribution = useCallback((data: Distribution) => {
    if (data && !seenIds.has(data.id)) {
      setSeenIds(prev => new Set(prev).add(data.id));
      setLatestDistribution(data);
    }
  }, [seenIds]);

  const clearDistribution = useCallback(() => {
    setLatestDistribution(null);
  }, []);

  // Subscribe to ERC20 distributions (no filter - sender is session account)
  const { loading: erc20Loading, error: erc20Error } = useSubscription(
    ERC20_DISTRIBUTION_SUBSCRIPTION,
    {
      skip: !userAddress,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onData: ({ data }: any) => {
        console.log("📥 ERC20 distribution data:", data);
        const distribution = data?.data?.ERC20PeriodTransferEnforcer_TransferredInPeriod?.[0];
        if (distribution) {
          console.log("🎉 New ERC20 distribution!", distribution);
          handleNewDistribution({
            ...distribution,
            token: distribution.token || "",
          });
        }
      },
    }
  );

  // Subscribe to Native token distributions (no filter - sender is session account)
  const { loading: nativeLoading, error: nativeError } = useSubscription(
    NATIVE_DISTRIBUTION_SUBSCRIPTION,
    {
      skip: !userAddress,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onData: ({ data }: any) => {
        console.log("📥 Native distribution data:", data);
        const distribution = data?.data?.NativeTokenPeriodTransferEnforcer_TransferredInPeriod?.[0];
        if (distribution) {
          console.log("🎉 New Native distribution!", distribution);
          handleNewDistribution({
            ...distribution,
            token: "0x0000000000000000000000000000000000000000", // Native ETH
          });
        }
      },
    }
  );

  return {
    latestDistribution,
    clearDistribution,
    loading: erc20Loading || nativeLoading,
    error: erc20Error || nativeError,
  };
}
