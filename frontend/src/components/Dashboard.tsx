"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Zap,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { Backup } from "./BackupAddresses";
import { TokenAllowance } from "./TokenSelector";
import Button from "./Button";

interface DashboardProps {
  backups: Backup[];
  tokenAllowances: TokenAllowance[];
  pulsePeriodSeconds: number;
  lastCheckIn: Date | null;
  isDistributing: boolean;
  onCheckIn: () => Promise<void>;
}

type Status = "protected" | "warning" | "distributing";

export default function Dashboard({
  backups,
  tokenAllowances,
  pulsePeriodSeconds,
  lastCheckIn,
  isDistributing,
  onCheckIn,
}: DashboardProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update current time every second for accurate countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining
  const deadline = lastCheckIn
    ? new Date(lastCheckIn.getTime() + pulsePeriodSeconds * 1000)
    : null;

  const timeRemaining = deadline ? deadline.getTime() - now.getTime() : 0;
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(
    0,
    Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  );
  const minutesRemaining = Math.max(
    0,
    Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
  );
  const secondsRemaining = Math.max(
    0,
    Math.floor((timeRemaining % (60 * 1000)) / 1000)
  );

  // Calculate progress percentage (inverted - 100% means just checked in)
  const totalPeriodMs = pulsePeriodSeconds * 1000;
  const elapsedMs = lastCheckIn ? now.getTime() - lastCheckIn.getTime() : 0;
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalPeriodMs) * 100));
  const safePercent = 100 - progressPercent;

  // Determine status - use percentage for warning threshold (works for any period length)
  const status: Status = isDistributing
    ? "distributing"
    : timeRemaining <= 0
    ? "distributing"
    : safePercent <= 20 // Less than 20% time remaining = warning
    ? "warning"
    : "protected";

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await onCheckIn();
    } finally {
      setIsCheckingIn(false);
    }
  };

  const statusConfig = {
    protected: {
      color: "green",
      icon: Shield,
      title: "Protected",
      description: "Your funds are safe. Keep checking in to maintain protection.",
    },
    warning: {
      color: "yellow",
      icon: AlertTriangle,
      title: "Check-in Soon",
      description: "Your pulse is about to expire. Check in to reset the timer.",
    },
    distributing: {
      color: "red",
      icon: Zap,
      title: "Distributing",
      description: "Funds are flowing to your backups. Check in to stop distribution.",
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div
        className={`rounded-xl p-6 border-2 ${
          status === "protected"
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : status === "warning"
            ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-full ${
              status === "protected"
                ? "bg-green-100 dark:bg-green-800"
                : status === "warning"
                ? "bg-yellow-100 dark:bg-yellow-800"
                : "bg-red-100 dark:bg-red-800"
            }`}
          >
            <StatusIcon
              className={`h-8 w-8 ${
                status === "protected"
                  ? "text-green-600 dark:text-green-400"
                  : status === "warning"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            />
          </div>
          <div className="flex-1">
            <h2
              className={`text-2xl font-bold ${
                status === "protected"
                  ? "text-green-800 dark:text-green-200"
                  : status === "warning"
                  ? "text-yellow-800 dark:text-yellow-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              {currentStatus.title}
            </h2>
            <p
              className={`${
                status === "protected"
                  ? "text-green-700 dark:text-green-300"
                  : status === "warning"
                  ? "text-yellow-700 dark:text-yellow-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {currentStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" />
            Time Until Pulse Expires
          </h3>
          {lastCheckIn && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last check-in: {lastCheckIn.toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Countdown Display */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { value: daysRemaining, label: "Days" },
            { value: hoursRemaining, label: "Hours" },
            { value: minutesRemaining, label: "Minutes" },
            { value: secondsRemaining, label: "Seconds" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <p
                className={`text-3xl font-bold font-mono ${
                  status === "distributing"
                    ? "text-red-600 dark:text-red-400"
                    : status === "warning"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {value.toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-1000 ${
              status === "protected"
                ? "bg-gradient-to-r from-green-500 to-green-400"
                : status === "warning"
                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                : "bg-gradient-to-r from-red-500 to-red-400"
            }`}
            style={{ width: `${safePercent}%` }}
          />
          {status === "distributing" && (
            <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Pulse expires</span>
          <span>{safePercent.toFixed(1)}% time remaining</span>
        </div>
      </div>

      {/* Check-in Button */}
      <Button
        onClick={handleCheckIn}
        disabled={isCheckingIn}
        className={`w-full py-4 text-lg font-semibold ${
          status === "distributing"
            ? "bg-red-600 hover:bg-red-700"
            : status === "warning"
            ? "bg-yellow-600 hover:bg-yellow-700"
            : "bg-primary-600 hover:bg-primary-700"
        }`}
      >
        {isCheckingIn ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Checking In...
          </>
        ) : status === "distributing" ? (
          <>
            <Zap className="h-5 w-5 mr-2" />
            Stop Distribution & Check In
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            I&apos;m Still Here
          </>
        )}
      </Button>

      {/* Token Flow Visualization */}
      {status === "distributing" && tokenAllowances.length > 0 && backups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-500" />
            Active Token Flows
          </h3>

          <div className="space-y-4">
            {tokenAllowances.map(({ token, amount, periodDays }) => (
              <div
                key={token.address}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image
                      src={token.icon}
                      alt={token.symbol}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {token.symbol}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(parseFloat(amount) / periodDays).toFixed(4)} {token.symbol}/day
                    </p>
                  </div>
                </div>

                {/* Flow to backups */}
                <div className="space-y-2">
                  {backups.map((backup) => {
                    const backupAmount =
                      (parseFloat(amount) * backup.allocationBps) / 10000 / periodDays;
                    return (
                      <div
                        key={backup.address}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-red-500 to-transparent relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-transparent animate-pulse" />
                          </div>
                          <ArrowRight className="h-4 w-4 text-red-500 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {backup.displayName}
                          </span>
                          <span className="text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                            {backupAmount.toFixed(4)} {token.symbol}/day
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Protected Tokens</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {tokenAllowances.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Backup Addresses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {backups.length}
          </p>
        </div>
      </div>

    </div>
  );
}
