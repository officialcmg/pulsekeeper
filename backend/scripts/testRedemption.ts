/**
 * Test script for redemption flow
 * 
 * This script simulates the full redemption flow:
 * 1. Stores a mock permission in the database
 * 2. Calls the redemption service to redeem it
 * 
 * Prerequisites:
 * - Backend running (pnpm dev)
 * - PostgreSQL database running
 * - User has granted permission via frontend (or use mock data)
 * 
 * Usage: pnpm tsx scripts/testRedemption.ts
 */

import dotenv from 'dotenv';
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Mock data for testing - replace with real values from frontend console logs
const MOCK_PERMISSION = {
  userAddress: '0x...', // Replace with your wallet address
  tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH
  permissionsContext: '0x...', // Replace with real context from frontend logs
  delegationManager: '0x...', // Replace with real delegation manager
  periodAmount: '0.01', // 0.01 ETH
  periodDurationSeconds: 86400, // 1 day
};

async function storePermission() {
  console.log('\n📝 Storing permission in backend...');
  
  const response = await fetch(`${BACKEND_URL}/api/permissions/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(MOCK_PERMISSION),
  });

  if (!response.ok) {
    throw new Error(`Failed to store permission: ${await response.text()}`);
  }

  const result = await response.json();
  console.log('   ✅ Permission stored:', result);
  return result;
}

async function getPermissions(userAddress: string) {
  console.log(`\n📋 Getting permissions for ${userAddress}...`);
  
  const response = await fetch(`${BACKEND_URL}/api/permissions/${userAddress}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get permissions: ${await response.text()}`);
  }

  const result = await response.json();
  console.log('   Permissions:', JSON.stringify(result, null, 2));
  return result;
}

async function triggerRedemption(userAddress: string) {
  console.log(`\n🚀 Triggering redemption for ${userAddress}...`);
  
  const response = await fetch(`${BACKEND_URL}/api/distribution/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress }),
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger redemption: ${await response.text()}`);
  }

  const result = await response.json();
  console.log('   Result:', JSON.stringify(result, null, 2));
  return result;
}

async function checkDistributionStatus(userAddress: string) {
  console.log(`\n📊 Checking distribution status for ${userAddress}...`);
  
  const response = await fetch(`${BACKEND_URL}/api/distribution/status/${userAddress}`);
  
  if (!response.ok) {
    throw new Error(`Failed to check status: ${await response.text()}`);
  }

  const result = await response.json();
  console.log('   Status:', JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  console.log('🧪 PulseKeeper Redemption Test\n');
  console.log('='.repeat(50));
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('='.repeat(50));

  // Check if using mock data
  if (MOCK_PERMISSION.userAddress === '0x...') {
    console.log('\n⚠️  WARNING: Using placeholder mock data!');
    console.log('   To test with real data:');
    console.log('   1. Run the frontend and grant a permission');
    console.log('   2. Check browser console for "🔐 Permissions granted:" log');
    console.log('   3. Copy the context and delegationManager values');
    console.log('   4. Update MOCK_PERMISSION in this script');
    console.log('   5. Run this script again');
    console.log('\n   Or test the API endpoints manually:');
    console.log(`   curl ${BACKEND_URL}/api/distribution/status`);
    return;
  }

  try {
    // Step 1: Store permission
    await storePermission();

    // Step 2: Get permissions to verify
    await getPermissions(MOCK_PERMISSION.userAddress);

    // Step 3: Check distribution status
    await checkDistributionStatus(MOCK_PERMISSION.userAddress);

    // Step 4: Trigger redemption
    await triggerRedemption(MOCK_PERMISSION.userAddress);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
