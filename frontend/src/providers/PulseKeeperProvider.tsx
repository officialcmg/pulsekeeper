"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Backup } from "@/components/BackupAddresses";
import { TokenAllowance } from "@/components/TokenSelector";
import { PulseSettings } from "@/components/PulseConfig";
import { SetupConfig } from "@/components/SetupWizard";
import { usePulseKeeperContract } from "@/hooks/usePulseKeeperContract";

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
  const { register, checkIn: contractCheckIn } = usePulseKeeperContract();

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
