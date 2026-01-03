import { sepolia } from 'viem/chains';

export const CHAIN = sepolia;
export const CHAIN_ID = sepolia.id;

// Pimlico bundler URL
export const PIMLICO_BUNDLER_URL = `https://api.pimlico.io/v2/${CHAIN_ID}/rpc?apikey=${process.env.PIMLICO_API_KEY}`;

// PulseKeeper Registry Contract
export const PULSEKEEPER_REGISTRY_ADDRESS = process.env.PULSEKEEPER_REGISTRY_ADDRESS as `0x${string}`;

// ERC20 ABI for transfers
export const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

// PulseKeeper Registry ABI (subset for reading)
export const PULSEKEEPER_REGISTRY_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isRegistered",
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
] as const;
