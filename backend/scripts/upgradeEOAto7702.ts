/**
 * Script to upgrade the session EOA to EIP-7702 smart account
 * 
 * This script:
 * 1. Signs an EIP-7702 authorization to delegate code to the MetaMask EIP7702StatelessDeleGator
 * 2. Submits a Type 4 transaction to set the EOA code
 * 3. Verifies the upgrade was successful
 * 
 * Run once: pnpm tsx scripts/upgradeEOAto7702.ts
 * After running, verify with: cast code <address> --rpc-url <sepolia_rpc>
 */

import dotenv from 'dotenv';
dotenv.config();

import { createPublicClient, createWalletClient, http, zeroAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';

const SESSION_PRIVATE_KEY = process.env.SESSION_PRIVATE_KEY as `0x${string}`;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';

if (!SESSION_PRIVATE_KEY) {
  console.error('❌ SESSION_PRIVATE_KEY not set in .env');
  process.exit(1);
}

async function upgradeEOAto7702() {
  console.log('🚀 EIP-7702 EOA Upgrade Script\n');
  console.log('='.repeat(50));

  // Step 1: Create account from private key
  const account = privateKeyToAccount(SESSION_PRIVATE_KEY);
  console.log(`📍 EOA Address: ${account.address}`);

  // Step 2: Set up clients
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL),
  });

  // Step 3: Check current code
  console.log('\n📋 Checking current EOA state...');
  const currentCode = await publicClient.getCode({ address: account.address });
  
  if (currentCode && currentCode !== '0x') {
    console.log(`✅ EOA already has code delegated!`);
    console.log(`   Code: ${currentCode.slice(0, 50)}...`);
    console.log('\n⚠️  No upgrade needed. Exiting.');
    return;
  }

  console.log('   Current code: (none - standard EOA)');

  // Step 4: Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`   Balance: ${balance} wei (${Number(balance) / 1e18} ETH)`);

  if (balance === 0n) {
    console.error('\n❌ EOA has no ETH for gas! Please fund the account first.');
    console.log(`   Address to fund: ${account.address}`);
    process.exit(1);
  }

  // Step 5: Get the EIP7702StatelessDeleGator contract address
  console.log('\n📋 Getting MetaMask EIP-7702 environment...');
  const environment = getSmartAccountsEnvironment(sepolia.id);
  const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl;
  console.log(`   EIP7702StatelessDeleGator: ${contractAddress}`);

  // Step 6: Sign the authorization
  console.log('\n📝 Signing EIP-7702 authorization...');
  const authorization = await walletClient.signAuthorization({
    account,
    contractAddress,
    executor: 'self',
  });
  console.log('   ✅ Authorization signed');

  // Step 7: Submit the authorization transaction (Type 4)
  console.log('\n🚀 Submitting EIP-7702 transaction...');
  const hash = await walletClient.sendTransaction({
    authorizationList: [authorization],
    data: '0x',
    to: zeroAddress,
  });
  console.log(`   TX Hash: ${hash}`);

  // Step 8: Wait for confirmation
  console.log('\n⏳ Waiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(`   Status: ${receipt.status}`);

  // Step 9: Verify the upgrade
  console.log('\n📋 Verifying upgrade...');
  const newCode = await publicClient.getCode({ address: account.address });
  
  if (newCode && newCode !== '0x') {
    console.log('   ✅ EOA successfully upgraded to EIP-7702 smart account!');
    console.log(`   Code: ${newCode.slice(0, 50)}...`);
  } else {
    console.error('   ❌ Upgrade failed - no code set');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Upgrade complete!');
  console.log(`\nVerify with cast:`);
  console.log(`   cast code ${account.address} --rpc-url ${SEPOLIA_RPC_URL}`);
}

upgradeEOAto7702().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
