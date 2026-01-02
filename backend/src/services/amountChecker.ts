import { getPermissionsForUser, StoredPermission } from '../db/permissions.js';
import { getRedeemedAmountInPeriod } from '../db/redemptions.js';

export interface TokenAllowance {
  tokenAddress: string;
  periodAmount: bigint;
  periodDurationSeconds: number;
  alreadyRedeemed: bigint;
  availableToRedeem: bigint;
  periodStart: Date;
  permission: StoredPermission;
}

/**
 * Calculate the current period start based on when permission was granted
 * and the period duration
 */
function calculateCurrentPeriodStart(
  grantedAt: Date,
  periodDurationSeconds: number
): Date {
  const now = Date.now();
  const grantedTime = grantedAt.getTime();
  const periodMs = periodDurationSeconds * 1000;
  
  // Calculate how many complete periods have passed
  const elapsedMs = now - grantedTime;
  const completePeriods = Math.floor(elapsedMs / periodMs);
  
  // Current period start is grantedAt + (completePeriods * periodDuration)
  const periodStartMs = grantedTime + (completePeriods * periodMs);
  
  return new Date(periodStartMs);
}

/**
 * Get available amounts for all tokens a user has granted permissions for
 * This is the core logic for checking how much can be redeemed
 * 
 * @param userAddress - The user's address
 * @returns Array of token allowances with available amounts
 */
export async function getAvailableAmounts(userAddress: string): Promise<TokenAllowance[]> {
  // Get all active permissions for the user
  const permissions = await getPermissionsForUser(userAddress);
  
  if (permissions.length === 0) {
    return [];
  }

  const allowances: TokenAllowance[] = [];

  for (const permission of permissions) {
    // Calculate the current period start
    const periodStart = calculateCurrentPeriodStart(
      permission.grantedAt,
      permission.periodDurationSeconds
    );

    // Get how much has already been redeemed in this period
    const alreadyRedeemed = await getRedeemedAmountInPeriod(
      userAddress,
      permission.tokenAddress,
      periodStart
    );

    const periodAmount = BigInt(permission.periodAmount);
    
    // Calculate available amount (period amount - already redeemed)
    const availableToRedeem = periodAmount > alreadyRedeemed 
      ? periodAmount - alreadyRedeemed 
      : 0n;

    allowances.push({
      tokenAddress: permission.tokenAddress,
      periodAmount,
      periodDurationSeconds: permission.periodDurationSeconds,
      alreadyRedeemed,
      availableToRedeem,
      periodStart,
      permission,
    });
  }

  return allowances;
}

/**
 * Check if a specific amount can be redeemed for a token
 * 
 * @param userAddress - The user's address
 * @param tokenAddress - The token address
 * @param amount - The amount to check
 * @returns Whether the amount can be redeemed
 */
export async function canRedeemAmount(
  userAddress: string,
  tokenAddress: string,
  amount: bigint
): Promise<{ canRedeem: boolean; available: bigint; reason?: string }> {
  const allowances = await getAvailableAmounts(userAddress);
  
  const tokenAllowance = allowances.find(
    (a) => a.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
  );

  if (!tokenAllowance) {
    return {
      canRedeem: false,
      available: 0n,
      reason: 'No permission found for this token',
    };
  }

  if (amount > tokenAllowance.availableToRedeem) {
    return {
      canRedeem: false,
      available: tokenAllowance.availableToRedeem,
      reason: `Requested ${amount} but only ${tokenAllowance.availableToRedeem} available in current period`,
    };
  }

  return {
    canRedeem: true,
    available: tokenAllowance.availableToRedeem,
  };
}

/**
 * Get a summary of all token allowances for a user
 * Useful for displaying in UI or logging
 */
export async function getAllowanceSummary(userAddress: string): Promise<{
  userAddress: string;
  totalTokens: number;
  allowances: Array<{
    tokenAddress: string;
    periodAmount: string;
    alreadyRedeemed: string;
    availableToRedeem: string;
    periodStartsAt: string;
    periodEndsAt: string;
  }>;
}> {
  const allowances = await getAvailableAmounts(userAddress);

  return {
    userAddress,
    totalTokens: allowances.length,
    allowances: allowances.map((a) => {
      const periodEndMs = a.periodStart.getTime() + (a.periodDurationSeconds * 1000);
      return {
        tokenAddress: a.tokenAddress,
        periodAmount: a.periodAmount.toString(),
        alreadyRedeemed: a.alreadyRedeemed.toString(),
        availableToRedeem: a.availableToRedeem.toString(),
        periodStartsAt: a.periodStart.toISOString(),
        periodEndsAt: new Date(periodEndMs).toISOString(),
      };
    }),
  };
}
