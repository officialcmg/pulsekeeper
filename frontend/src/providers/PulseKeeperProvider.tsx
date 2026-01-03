"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { Backup } from "@/components/BackupAddresses";
import { TokenAllowance } from "@/components/TokenSelector";
import { PulseSettings } from "@/components/PulseConfig";
import { SetupConfig } from "@/components/SetupWizard";
import { usePulseKeeperContract } from "@/hooks/usePulseKeeperContract";
import { useCheckInSubscription } from "@/hooks/useDistributionSubscription";

interface PulseKeeperState {
  isSetupComplete: boolean;
  tokenAllowances: TokenAllowance[];
  backups: Backup[];
  pulseSettings: PulseSettings;
  lastCheckIn: Date | null;
  isDistributing: boolean;
  isRegistering: boolean;
  registerError: string | null;
}

interface PulseKeeperContextType extends PulseKeeperState {
  completeSetup: (config: SetupConfig) => Promise<void>;
  checkIn: () => Promise<void>;
  resetSetup: () => void;
}

const defaultState: PulseKeeperState = {
  isSetupComplete: false,
  tokenAllowances: [],
  backups: [],
  pulseSettings: { pulsePeriodSeconds: 2592000, customPeriod: false }, // 30 days in seconds
  lastCheckIn: null,
  isDistributing: false,
  isRegistering: false,
  registerError: null,
};

const PulseKeeperContext = createContext<PulseKeeperContextType>({
  ...defaultState,
  completeSetup: async () => {},
  checkIn: async () => {},
  resetSetup: () => {},
});

export function PulseKeeperProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PulseKeeperState>(defaultState);
  const { address } = useAccount();
  const { register, checkIn: contractCheckIn } = usePulseKeeperContract();
  
  // Subscribe to check-in and registration data from indexer
  const { latestCheckIn, registration, isRegistered, loading: indexerLoading } = useCheckInSubscription(address);

  // Sync indexer data to state (cross-session persistence)
  useEffect(() => {
    if (isRegistered && latestCheckIn && !state.isSetupComplete) {
      console.log("📊 Restored state from indexer - user is registered");
      const checkInDate = new Date(Number(latestCheckIn.timestamp) * 1000);
      const pulsePeriodSeconds = registration ? Number(registration.pulsePeriodSeconds) : 2592000;
      
      setState((prev) => ({
        ...prev,
        isSetupComplete: true,
        lastCheckIn: checkInDate,
        pulseSettings: { 
          pulsePeriodSeconds, 
          customPeriod: pulsePeriodSeconds !== 2592000 
        },
      }));
    }
  }, [isRegistered, latestCheckIn, registration, state.isSetupComplete]);

  // Update lastCheckIn when new check-in comes from indexer (real-time)
  useEffect(() => {
    if (latestCheckIn && state.isSetupComplete) {
      const checkInDate = new Date(Number(latestCheckIn.timestamp) * 1000);
      // Only update if newer than current
      if (!state.lastCheckIn || checkInDate > state.lastCheckIn) {
        console.log("🔄 Updated check-in from indexer:", checkInDate);
        setState((prev) => ({
          ...prev,
          lastCheckIn: checkInDate,
          isDistributing: false,
        }));
      }
    }
  }, [latestCheckIn, state.isSetupComplete, state.lastCheckIn]);

  const completeSetup = useCallback(async (config: SetupConfig) => {
    // Set registering state
    setState((prev) => ({
      ...prev,
      isRegistering: true,
      registerError: null,
    }));

    try {
      // Call the contract to register the user with backups and pulse period
      console.log("🔄 Registering on PulseKeeper contract...");
      const txHash = await register(config.pulseSettings.pulsePeriodSeconds, config.backups);
      console.log("✅ Registered on contract, tx:", txHash);

      setState({
        isSetupComplete: true,
        tokenAllowances: config.tokenAllowances,
        backups: config.backups,
        pulseSettings: config.pulseSettings,
        lastCheckIn: new Date(),
        isDistributing: false,
        isRegistering: false,
        registerError: null,
      });
    } catch (error) {
      console.error("❌ Failed to register on contract:", error);
      setState((prev) => ({
        ...prev,
        isRegistering: false,
        registerError: error instanceof Error ? error.message : "Failed to register",
      }));
      throw error; // Re-throw so SetupWizard can handle it
    }
  }, [register]);

  const checkIn = useCallback(async () => {
    // Call the contract's checkIn function
    const txHash = await contractCheckIn();
    console.log("✅ Check-in confirmed, tx:", txHash);
    setState((prev) => ({
      ...prev,
      lastCheckIn: new Date(),
      isDistributing: false,
    }));
  }, [contractCheckIn]);

  const resetSetup = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <PulseKeeperContext.Provider
      value={{
        ...state,
        completeSetup,
        checkIn,
        resetSetup,
      }}
    >
      {children}
    </PulseKeeperContext.Provider>
  );
}

export const usePulseKeeper = () => useContext(PulseKeeperContext);
