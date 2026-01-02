"use client";

import { Shield, Heart, Clock, Users } from "lucide-react";

export default function PulseKeeperHero() {
  return (
    <div className="text-center py-8 mb-8">
      {/* Logo/Icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Heart className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white dark:border-black">
            <Shield className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        Pulse<span className="text-primary-500">Keeper</span>
      </h1>

      {/* Tagline */}
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
        Your crypto stays safe, even when you can&apos;t access it.
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
          <Shield className="h-4 w-4 text-primary-500" />
          Non-Custodial
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
          <Clock className="h-4 w-4 text-primary-500" />
          Time-Locked
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
          <Users className="h-4 w-4 text-primary-500" />
          ENS Support
        </div>
      </div>

      {/* Description */}
      <div className="max-w-xl mx-auto text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          Over $140 billion in crypto is permanently lost. Not hacked. Not stolen. Just inaccessible.
          PulseKeeper uses MetaMask Advanced Permissions to create a recovery system that keeps your funds
          in YOUR wallet until they need to move.
        </p>
      </div>
    </div>
  );
}
