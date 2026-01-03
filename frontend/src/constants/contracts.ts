import { Address } from "viem";

// PulseKeeper Registry contract address (deployed on Sepolia)
export const PULSEKEEPER_REGISTRY_ADDRESS: Address = "0x7231C8225D970Dd67e8Afda5348Ddc2afb0Ac237";

// PulseKeeper Registry ABI - matches contracts/src/PulseKeeperRegistry.sol
export const PULSEKEEPER_REGISTRY_ABI = [
  // Register function
  {
    inputs: [
      { name: "pulsePeriodSeconds", type: "uint256" },
      {
        components: [
          { name: "addr", type: "address" },
          { name: "allocationBps", type: "uint16" },
        ],
        name: "backups",
        type: "tuple[]",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Check in
  {
    inputs: [],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Set backups
  {
    inputs: [
      {
        components: [
          { name: "addr", type: "address" },
          { name: "allocationBps", type: "uint16" },
        ],
        name: "backups",
        type: "tuple[]",
      },
    ],
    name: "setBackups",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Set pulse period
  {
    inputs: [{ name: "pulsePeriodSeconds", type: "uint256" }],
    name: "setPulsePeriod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // View functions
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getLastCheckIn",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getPulsePeriod",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getBackups",
    outputs: [
      {
        components: [
          { name: "addr", type: "address" },
          { name: "allocationBps", type: "uint16" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isRegistered",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isDistributing",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getDeadline",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserConfig",
    outputs: [
      { name: "registered", type: "bool" },
      { name: "lastCheckIn", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "pulsePeriodSeconds", type: "uint256" },
      {
        components: [
          { name: "addr", type: "address" },
          { name: "allocationBps", type: "uint16" },
        ],
        name: "backups",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Events - Enhanced for indexer
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "pulsePeriodSeconds", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint256" },
    ],
    name: "UserRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint256" },
    ],
    name: "CheckIn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      {
        components: [
          { name: "addr", type: "address" },
          { name: "allocationBps", type: "uint16" },
        ],
        indexed: false,
        name: "backups",
        type: "tuple[]",
      },
    ],
    name: "BackupsUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "pulsePeriodSeconds", type: "uint256" },
      { indexed: false, name: "newDeadline", type: "uint256" },
    ],
    name: "PulsePeriodUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "backup", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "Distribution",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "backupCount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "DistributionBatch",
    type: "event",
  },
  // recordDistribution function
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
      { name: "backupAddresses", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "recordDistribution",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Errors
  {
    inputs: [],
    name: "InvalidAllocation",
    type: "error",
  },
  {
    inputs: [],
    name: "NoBackupsSet",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPulsePeriod",
    type: "error",
  },
  {
    inputs: [],
    name: "NotRegistered",
    type: "error",
  },
] as const;

// Backup struct type
export interface BackupStruct {
  addr: Address;
  allocationBps: number;
}
