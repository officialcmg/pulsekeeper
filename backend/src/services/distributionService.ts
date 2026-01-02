import { type Address } from 'viem';
import { publicClient } from '../config/clients.js';
import { PULSEKEEPER_REGISTRY_ADDRESS, PULSEKEEPER_REGISTRY_ABI } from '../config/constants.js';
import { getAllUsersWithPermissions } from '../db/permissions.js';
import { redeemForUser, RedemptionResult, isUserDistributing } from './redemptionService.js';

export interface DistributionCheckResult {
  userAddress: string;
  isRegistered: boolean;
  isDistributing: boolean;
  deadline: number;
  deadlinePassed: boolean;
}

export interface DistributionRunResult {
  timestamp: string;
  usersChecked: number;
  usersDistributing: number;
  results: RedemptionResult[];
  errors: string[];
}

/**
 * Check if a user's deadline has passed and they should be distributing
 */
export async function checkUserDistributionStatus(
  userAddress: string
): Promise<DistributionCheckResult> {
  const userAddr = userAddress as Address;

  try {
    const [registered, distributing, deadline] = await Promise.all([
      publicClient.readContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: 'isRegistered',
        args: [userAddr],
      }),
      publicClient.readContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: 'isDistributing',
        args: [userAddr],
      }),
      publicClient.readContract({
        address: PULSEKEEPER_REGISTRY_ADDRESS,
        abi: PULSEKEEPER_REGISTRY_ABI,
        functionName: 'getDeadline',
        args: [userAddr],
      }),
    ]);

    const deadlineTimestamp = Number(deadline);
    const now = Math.floor(Date.now() / 1000);

    return {
      userAddress,
      isRegistered: registered,
      isDistributing: distributing,
      deadline: deadlineTimestamp,
      deadlinePassed: now > deadlineTimestamp,
    };
  } catch (error: any) {
    console.error(`Error checking user ${userAddress}:`, error.message);
    return {
      userAddress,
      isRegistered: false,
      isDistributing: false,
      deadline: 0,
      deadlinePassed: false,
    };
  }
}

/**
 * Main distribution service function
 * Checks all registered users and triggers redemption for those past their deadline
 * 
 * This is called by the /api/distribution/run endpoint
 */
export async function runDistributionCheck(): Promise<DistributionRunResult> {
  const result: DistributionRunResult = {
    timestamp: new Date().toISOString(),
    usersChecked: 0,
    usersDistributing: 0,
    results: [],
    errors: [],
  };

  try {
    // Get all users with stored permissions
    const usersWithPermissions = await getAllUsersWithPermissions();
    result.usersChecked = usersWithPermissions.length;

    console.log(`\n🔍 Distribution check started at ${result.timestamp}`);
    console.log(`   Checking ${usersWithPermissions.length} users with permissions...`);

    // Check each user's distribution status
    for (const userAddress of usersWithPermissions) {
      try {
        const status = await checkUserDistributionStatus(userAddress);

        if (!status.isRegistered) {
          console.log(`   ⏭️ ${userAddress}: Not registered in contract`);
          continue;
        }

        if (!status.isDistributing) {
          console.log(`   ✅ ${userAddress}: Active (deadline not passed)`);
          continue;
        }

        // User is distributing - trigger redemption
        console.log(`   💸 ${userAddress}: DISTRIBUTING - triggering redemption...`);
        result.usersDistributing++;

        const redemptionResult = await redeemForUser(userAddress);
        result.results.push(redemptionResult);

        if (redemptionResult.success) {
          console.log(`   ✅ ${userAddress}: Redemption successful`);
        } else {
          console.log(`   ⚠️ ${userAddress}: Redemption had errors: ${redemptionResult.errors.join(', ')}`);
        }

      } catch (error: any) {
        console.error(`   ❌ Error processing ${userAddress}:`, error.message);
        result.errors.push(`${userAddress}: ${error.message}`);
      }
    }

    console.log(`\n📊 Distribution check complete:`);
    console.log(`   Users checked: ${result.usersChecked}`);
    console.log(`   Users distributing: ${result.usersDistributing}`);
    console.log(`   Errors: ${result.errors.length}`);

    return result;

  } catch (error: any) {
    console.error('Distribution check failed:', error);
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Get distribution status for all users with permissions
 * Useful for monitoring/dashboard
 */
export async function getAllUsersDistributionStatus(): Promise<DistributionCheckResult[]> {
  const usersWithPermissions = await getAllUsersWithPermissions();
  const statuses: DistributionCheckResult[] = [];

  for (const userAddress of usersWithPermissions) {
    const status = await checkUserDistributionStatus(userAddress);
    statuses.push(status);
  }

  return statuses;
}
