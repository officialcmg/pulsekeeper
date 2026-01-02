"use client";

import { useState } from "react";
import { Clock, Timer, AlertTriangle, Info } from "lucide-react";

export interface PulseSettings {
  pulsePeriodDays: number;
  customPeriod: boolean;
}

interface PulseConfigProps {
  settings: PulseSettings;
  onSettingsChange: (settings: PulseSettings) => void;
}

const PRESET_PERIODS = [
  { days: 1, label: "1 Day", description: "Daily check-in" },
  { days: 7, label: "1 Week", description: "Check in weekly" },
  { days: 14, label: "2 Weeks", description: "Bi-weekly check-in" },
  { days: 30, label: "1 Month", description: "Monthly check-in" },
  { days: 90, label: "3 Months", description: "Quarterly check-in" },
];

export default function PulseConfig({
  settings,
  onSettingsChange,
}: PulseConfigProps) {
  const [showCustom, setShowCustom] = useState(settings.customPeriod);

  const handlePresetSelect = (days: number) => {
    setShowCustom(false);
    onSettingsChange({ pulsePeriodDays: days, customPeriod: false });
  };

  const handleCustomChange = (days: number) => {
    onSettingsChange({ pulsePeriodDays: Math.max(1, days), customPeriod: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Timer className="h-5 w-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Set Your Pulse Period
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        How often do you want to check in? If you miss a check-in, your funds will start flowing to your backups.
      </p>

      {/* Preset Options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {PRESET_PERIODS.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePresetSelect(preset.days)}
            className={`p-4 rounded-lg border-2 transition-all ${
              settings.pulsePeriodDays === preset.days && !showCustom
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
            }`}
          >
            <p
              className={`font-semibold ${
                settings.pulsePeriodDays === preset.days && !showCustom
                  ? "text-primary-700 dark:text-primary-300"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {preset.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {preset.description}
            </p>
          </button>
        ))}
      </div>

      {/* Custom Period Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setShowCustom(!showCustom);
            if (!showCustom) {
              onSettingsChange({ ...settings, customPeriod: true });
            }
          }}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          {showCustom ? "Use preset" : "Set custom period"}
        </button>
      </div>

      {/* Custom Period Input */}
      {showCustom && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom period (days)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="365"
              value={settings.pulsePeriodDays}
              onChange={(e) => handleCustomChange(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
            />
            <span className="text-gray-600 dark:text-gray-400">days</span>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">How it works:</span> After{" "}
            <span className="font-semibold">{settings.pulsePeriodDays} days</span> of
            inactivity, your funds will automatically start flowing to your backup
            addresses at the rate you configured.
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            You can always cancel by checking in - even after distribution starts.
          </p>
        </div>
      </div>

      {/* Warning for short periods */}
      {settings.pulsePeriodDays < 7 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-medium">Short period warning:</span> A{" "}
            {settings.pulsePeriodDays}-day period means you need to check in frequently.
            Make sure you can commit to this schedule.
          </p>
        </div>
      )}

      {/* Visual Timeline */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Timeline Preview
        </p>
        <div className="relative">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{ width: "100%" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Check-in
            </span>
            <span>Day {Math.floor(settings.pulsePeriodDays / 2)}</span>
            <span className="text-red-500 font-medium">
              Day {settings.pulsePeriodDays} - Distribution starts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
