"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Backup } from "@/components/BackupAddresses";
import { TokenAllowance } from "@/components/TokenSelector";
import { PulseSettings } from "@/components/PulseConfig";
import { SetupConfig } from "@/components/SetupWizard";

interface PulseKeeperState {
  isSetupComplete: boolean;
  tokenAllowances: TokenAllowance[];
  backups: Backup[];
  pulseSettings: PulseSettings;
  lastCheckIn: Date | null;
  isDistributing: boolean;
}

interface PulseKeeperContextType extends PulseKeeperState {
  completeSetup: (config: SetupConfig) => void;
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
};

const PulseKeeperContext = createContext<PulseKeeperContextType>({
  ...defaultState,
  completeSetup: () => {},
  checkIn: async () => {},
  resetSetup: () => {},
});

export function PulseKeeperProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PulseKeeperState>(defaultState);

  const completeSetup = useCallback((config: SetupConfig) => {
    setState({
      isSetupComplete: true,
      tokenAllowances: config.tokenAllowances,
      backups: config.backups,
      pulseSettings: config.pulseSettings,
      lastCheckIn: new Date(), // Initial check-in on setup
      isDistributing: false,
    });
  }, []);

  const checkIn = useCallback(async () => {
    // TODO: This will call the PulseKeeper contract's checkIn function
    // For now, we just update the local state
    setState((prev) => ({
      ...prev,
      lastCheckIn: new Date(),
      isDistributing: false,
    }));
  }, []);

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
