import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN, PIMLICO_BUNDLER_URL } from './constants.js';

// Session account from private key
const sessionPrivateKey = process.env.SESSION_PRIVATE_KEY as `0x${string}`;

if (!sessionPrivateKey) {
  console.warn('⚠️ SESSION_PRIVATE_KEY not set in environment');
}

export const sessionAccount = sessionPrivateKey 
  ? privateKeyToAccount(sessionPrivateKey)
  : null;

export const SESSION_ACCOUNT_ADDRESS = sessionAccount?.address;

// Public client for reading blockchain state
export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

// Wallet client for the session account
export const sessionWalletClient = sessionAccount
  ? createWalletClient({
      account: sessionAccount,
      chain: CHAIN,
      transport: http(process.env.SEPOLIA_RPC_URL),
    })
  : null;

console.log(`🔐 Session Account: ${SESSION_ACCOUNT_ADDRESS || 'not configured'}`);
