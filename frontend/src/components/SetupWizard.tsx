"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { useChainId, useWalletClient } from "wagmi";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  Coins,
  Users,
  Timer,
  Shield,
} from "lucide-react";
import Button from "./Button";
import TokenSelector, { TokenAllowance } from "./TokenSelector";
import BackupAddresses, { Backup } from "./BackupAddresses";
import PulseConfig, { PulseSettings } from "./PulseConfig";
import { NATIVE_ETH } from "@/constants/tokens";

interface SetupWizardProps {
  onComplete: (config: SetupConfig) => void;
}

export interface SetupConfig {
  tokenAllowances: TokenAllowance[];
  backups: Backup[];
  pulseSettings: PulseSettings;
}

const STEPS = [
  { id: 1, title: "Select Tokens", icon: Coins, description: "Choose which tokens to protect" },
  { id: 2, title: "Add Backups", icon: Users, description: "Set your recovery addresses" },
  { id: 3, title: "Set Pulse", icon: Timer, description: "Configure check-in period" },
  { id: 4, title: "Grant Permission", icon: Shield, description: "Authorize the protection" },
];

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tokenAllowances, setTokenAllowances] = useState<TokenAllowance[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [pulseSettings, setPulseSettings] = useState<PulseSettings>({
    pulsePeriodDays: 30,
    customPeriod: false,
  });
  const [isGranting, setIsGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  const { sessionAccount, sessionAccountAddress } = useSessionAccount();
  const { savePermission } = usePermissions();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          tokenAllowances.length > 0 &&
          tokenAllowances.every((t) => t.amount && parseFloat(t.amount) > 0)
        );
      case 2:
        const totalAllocation = backups.reduce((sum, b) => sum + b.allocationBps, 0);
        return backups.length > 0 && totalAllocation === 10000;
      case 3:
        return pulseSettings.pulsePeriodDays >= 1;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleGrantPermissions = async () => {
    if (!walletClient) {
      setGrantError("Wallet not connected");
      return;
    }

    setIsGranting(true);
    setGrantError(null);

    try {
      const client = walletClient.extend(erc7715ProviderActions());
      const currentTime = Math.floor(Date.now() / 1000);
      // Permission valid for 1 year
      const expiry = currentTime + 365 * 24 * 60 * 60;

      // Build permission requests for each token
      const permissionRequests = tokenAllowances.map(({ token, amount, periodDays }) => {
        const periodDurationSeconds = periodDays * 24 * 60 * 60;
        const periodAmount = parseUnits(amount, token.decimals);

        // Check if it's native token (ETH) or ERC20
        const isNative = token.address === NATIVE_ETH.address;

        if (isNative) {
          return {
            chainId,
            expiry,
            signer: {
              type: "account" as const,
              data: {
                address: sessionAccountAddress,
              },
            },
            isAdjustmentAllowed: true,
            permission: {
              type: "native-token-periodic" as const,
              data: {
                periodAmount,
                periodDuration: periodDurationSeconds,
                justification: `PulseKeeper: ${amount} ETH every ${periodDays} days for recovery`,
              },
            },
          };
        } else {
          return {
            chainId,
            expiry,
            signer: {
              type: "account" as const,
              data: {
                address: sessionAccountAddress,
              },
            },
            isAdjustmentAllowed: true,
            permission: {
              type: "erc20-token-periodic" as const,
              data: {
                tokenAddress: token.address,
                periodAmount,
                periodDuration: periodDurationSeconds,
                justification: `PulseKeeper: ${amount} ${token.symbol} every ${periodDays} days for recovery`,
              },
            },
          };
        }
      });

      const permissions = await client.requestExecutionPermissions(permissionRequests);

      // Log the permissions for debugging
      console.log("🔐 Permissions granted:", JSON.stringify(permissions, (_, v) => 
        typeof v === 'bigint' ? v.toString() : v, 2));

      // Save permissions to backend for each token
      if (permissions && permissions.length > 0) {
        // Save first permission to local state
        savePermission(permissions[0]);

        // Send all permissions to backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        
        for (let i = 0; i < permissions.length; i++) {
          const permission = permissions[i];
          const tokenAllowance = tokenAllowances[i];
          
          try {
            const response = await fetch(`${backendUrl}/api/permissions/store`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userAddress: walletClient.account?.address,
                tokenAddress: tokenAllowance.token.address,
                permissionsContext: permission.context,
                delegationManager: permission.signerMeta?.delegationManager || '',
                periodAmount: tokenAllowance.amount,
                periodDurationSeconds: tokenAllowance.periodDays * 24 * 60 * 60,
              }),
            });
            
            if (!response.ok) {
              console.error('Failed to store permission in backend:', await response.text());
            } else {
              console.log(`✅ Permission stored in backend for ${tokenAllowance.token.symbol}`);
            }
          } catch (err) {
            console.error('Error sending permission to backend:', err);
          }
        }
      }

      // Complete setup
      onComplete({
        tokenAllowances,
        backups,
        pulseSettings,
      });
    } catch (error) {
      console.error("Error granting permissions:", error);
      setGrantError(
        error instanceof Error ? error.message : "Failed to grant permissions"
      );
    } finally {
      setIsGranting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TokenSelector
            selectedTokens={tokenAllowances}
            onTokensChange={setTokenAllowances}
          />
        );
      case 2:
        return <BackupAddresses backups={backups} onBackupsChange={setBackups} />;
      case 3:
        return (
          <PulseConfig settings={pulseSettings} onSettingsChange={setPulseSettings} />
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-primary-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Ready to Protect Your Assets
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Review your configuration and grant the permission to activate PulseKeeper.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Protected Tokens
                </p>
                <div className="space-y-1">
                  {tokenAllowances.map(({ token, amount, periodDays }) => (
                    <p key={token.address} className="text-gray-900 dark:text-white">
                      {amount} {token.symbol} / {periodDays} days
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Backup Addresses
                </p>
                <div className="space-y-1">
                  {backups.map((backup) => (
                    <p key={backup.address} className="text-gray-900 dark:text-white">
                      {backup.displayName} - {(backup.allocationBps / 100).toFixed(0)}%
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Pulse Period
                </p>
                <p className="text-gray-900 dark:text-white">
                  {pulseSettings.pulsePeriodDays} days
                </p>
              </div>
            </div>

            {grantError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{grantError}</p>
              </div>
            )}

            <Button
              onClick={handleGrantPermissions}
              disabled={isGranting}
              className="w-full py-4 text-lg"
            >
              {isGranting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Granting Permission...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Grant Permission & Activate
                </>
              )}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <p
                  className={`text-xs mt-1 text-center ${
                    isActive
                      ? "text-primary-600 dark:text-primary-400 font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
