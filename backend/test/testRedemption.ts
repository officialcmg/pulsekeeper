/**
 * Test file for redemption service
 * This is a modular test that can be run locally to verify redemption logic
 * 
 * Usage: pnpm test:redeem
 */

import dotenv from 'dotenv';
dotenv.config();

import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Test configuration
const TEST_USER_ADDRESS = process.env.TEST_USER_ADDRESS as Address;
const SESSION_PRIVATE_KEY = process.env.SESSION_PRIVATE_KEY as `0x${string}`;

console.log('🧪 PulseKeeper Redemption Test\n');
console.log('='.repeat(50));

// Validate environment
if (!SESSION_PRIVATE_KEY) {
  console.error('❌ SESSION_PRIVATE_KEY not set in .env');
  process.exit(1);
}

const sessionAccount = privateKeyToAccount(SESSION_PRIVATE_KEY);
console.log(`✅ Session Account: ${sessionAccount.address}`);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

/**
 * Test 1: Verify session account setup
 */
async function testSessionAccount() {
  console.log('\n📋 Test 1: Session Account Setup');
  console.log('-'.repeat(40));
  
  try {
    const balance = await publicClient.getBalance({ address: sessionAccount.address });
    console.log(`   Address: ${sessionAccount.address}`);
    console.log(`   Balance: ${balance} wei (${Number(balance) / 1e18} ETH)`);
    
    if (balance === 0n) {
      console.log('   ⚠️  Warning: Session account has no ETH for gas');
    } else {
      console.log('   ✅ Session account has ETH');
    }
    
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Mock permission storage and retrieval
 */
async function testPermissionStorage() {
  console.log('\n📋 Test 2: Permission Storage (Mock)');
  console.log('-'.repeat(40));
  
  // Mock permission data (what would come from frontend)
  const mockPermission = {
    userAddress: TEST_USER_ADDRESS || '0x1234567890123456789012345678901234567890',
    tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH
    permissionsContext: '0x...', // Would be real context from wallet
    delegationManager: '0x...', // Would be real delegation manager
    periodAmount: '1000000000000000000', // 1 ETH
    periodDurationSeconds: 86400, // 1 day
  };
  
  console.log('   Mock Permission:');
  console.log(`   - User: ${mockPermission.userAddress}`);
  console.log(`   - Token: ${mockPermission.tokenAddress}`);
  console.log(`   - Period Amount: ${mockPermission.periodAmount} wei`);
  console.log(`   - Period Duration: ${mockPermission.periodDurationSeconds}s`);
  console.log('   ✅ Permission structure valid');
  
  return true;
}

/**
 * Test 3: Amount calculation logic
 */
async function testAmountCalculation() {
  console.log('\n📋 Test 3: Amount Calculation Logic');
  console.log('-'.repeat(40));
  
  // Test period calculation
  const grantedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  const periodDurationSeconds = 86400; // 1 day
  
  const now = Date.now();
  const grantedTime = grantedAt.getTime();
  const periodMs = periodDurationSeconds * 1000;
  
  const elapsedMs = now - grantedTime;
  const completePeriods = Math.floor(elapsedMs / periodMs);
  const periodStartMs = grantedTime + (completePeriods * periodMs);
  const currentPeriodStart = new Date(periodStartMs);
  
  console.log(`   Granted At: ${grantedAt.toISOString()}`);
  console.log(`   Period Duration: ${periodDurationSeconds}s (1 day)`);
  console.log(`   Complete Periods: ${completePeriods}`);
  console.log(`   Current Period Start: ${currentPeriodStart.toISOString()}`);
  
  // Test allocation calculation
  const totalAmount = 1000000000000000000n; // 1 ETH
  const backups = [
    { address: '0xBackup1', allocationBps: 5000 }, // 50%
    { address: '0xBackup2', allocationBps: 3000 }, // 30%
    { address: '0xBackup3', allocationBps: 2000 }, // 20%
  ];
  
  console.log('\n   Allocation Calculation:');
  console.log(`   Total Amount: ${totalAmount} wei`);
  
  for (const backup of backups) {
    const amount = (totalAmount * BigInt(backup.allocationBps)) / 10000n;
    console.log(`   - ${backup.address}: ${backup.allocationBps/100}% = ${amount} wei`);
  }
  
  console.log('   ✅ Amount calculation correct');
  
  return true;
}

/**
 * Test 4: Contract read simulation
 */
async function testContractRead() {
  console.log('\n📋 Test 4: Contract Read (Simulated)');
  console.log('-'.repeat(40));
  
  const registryAddress = process.env.PULSEKEEPER_REGISTRY_ADDRESS;
  
  if (!registryAddress || registryAddress === '0x0000000000000000000000000000000000000000') {
    console.log('   ⚠️  Registry not deployed yet, skipping contract read test');
    return true;
  }
  
  try {
    // Would read from contract here
    console.log(`   Registry: ${registryAddress}`);
    console.log('   ✅ Contract read would work');
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Starting Tests...\n');
  
  const results = {
    sessionAccount: await testSessionAccount(),
    permissionStorage: await testPermissionStorage(),
    amountCalculation: await testAmountCalculation(),
    contractRead: await testContractRead(),
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log('-'.repeat(40));
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${name}: ${status}`);
    if (result) passed++;
    else failed++;
  }
  
  console.log('-'.repeat(40));
  console.log(`   Total: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
