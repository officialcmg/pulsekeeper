"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePermissions } from "@/providers/PermissionProvider";
import { usePulseKeeper } from "@/providers/PulseKeeperProvider";
import ConnectButton from "./ConnectButton";
import SetupWizard from "./SetupWizard";
import Dashboard from "./Dashboard";
import PulseKeeperHero from "./PulseKeeperHero";
import Header from "./Header";
import Footer from "./Footer";
import { Loader2 } from "lucide-react";

type AppStep = "connect" | "setup" | "dashboard";

export default function MainApp() {
  const { isConnected, isConnecting } = useAccount();
  const { permission } = usePermissions();
  const {
    isSetupComplete,
    tokenAllowances,
    backups,
    pulseSettings,
    lastCheckIn,
    isDistributing,
    completeSetup,
    checkIn,
  } = usePulseKeeper();

  const [currentStep, setCurrentStep] = useState<AppStep>("connect");

  useEffect(() => {
    if (!isConnected) {
      setCurrentStep("connect");
    } else if (!isSetupComplete) {
      setCurrentStep("setup");
    } else {
      setCurrentStep("dashboard");
    }
  }, [isConnected, isSetupComplete]);

  const renderContent = () => {
    switch (currentStep) {
      case "connect":
        return (
          <div className="space-y-6 flex flex-col items-center justify-center py-12">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-lg text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Connect your MetaMask wallet to get started. Make sure your account is upgraded to a{" "}
                <a
                  href="https://support.metamask.io/configure/accounts/switch-to-or-revert-from-a-smart-account/"
                  className="text-primary-500 hover:text-primary-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MetaMask Smart Account
                </a>{" "}
                for Advanced Permissions support.
              </p>
            </div>
            {isConnecting ? (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>
        );

      case "setup":
        return <SetupWizard onComplete={completeSetup} />;

      case "dashboard":
        return (
          <Dashboard
            backups={backups}
            tokenAllowances={tokenAllowances}
            pulsePeriodSeconds={pulseSettings.pulsePeriodSeconds}
            lastCheckIn={lastCheckIn}
            isDistributing={isDistributing}
            onCheckIn={checkIn}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        {currentStep !== "dashboard" && <PulseKeeperHero />}
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}
