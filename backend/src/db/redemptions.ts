import { pool } from './index.js';

export interface Redemption {
  id: number;
  userAddress: string;
  tokenAddress: string;
  amount: string;
  txHash: string;
  redeemedAt: Date;
  periodStart: Date;
}

export interface CreateRedemptionParams {
  userAddress: string;
  tokenAddress: string;
  amount: string;
  txHash: string;
  periodStart: Date;
}

/**
 * Record a redemption
 */
export async function recordRedemption(params: CreateRedemptionParams): Promise<void> {
  const { userAddress, tokenAddress, amount, txHash, periodStart } = params;

  const normalizedUserAddress = userAddress.toLowerCase();
  const normalizedTokenAddress = tokenAddress.toLowerCase();

  await pool.query(
    `
    INSERT INTO redemptions (user_address, token_address, amount, tx_hash, redeemed_at, period_start)
    VALUES ($1, $2, $3, $4, NOW(), $5)
    `,
    [normalizedUserAddress, normalizedTokenAddress, amount, txHash, periodStart]
  );
}

/**
 * Get total amount redeemed in the current period for a user/token
 */
export async function getRedeemedAmountInPeriod(
  userAddress: string,
  tokenAddress: string,
  periodStart: Date
): Promise<bigint> {
  const normalizedUserAddress = userAddress.toLowerCase();
  const normalizedTokenAddress = tokenAddress.toLowerCase();

  const result = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM redemptions
    WHERE user_address = $1 
      AND token_address = $2 
      AND period_start = $3
    `,
    [normalizedUserAddress, normalizedTokenAddress, periodStart]
  );

  return BigInt(result.rows[0].total || '0');
}

/**
 * Get all redemptions for a user
 */
export async function getRedemptionsForUser(userAddress: string): Promise<Redemption[]> {
  const normalizedAddress = userAddress.toLowerCase();

  const result = await pool.query(
    `
    SELECT 
      id,
      user_address as "userAddress",
      token_address as "tokenAddress",
      amount,
      tx_hash as "txHash",
      redeemed_at as "redeemedAt",
      period_start as "periodStart"
    FROM redemptions 
    WHERE user_address = $1
    ORDER BY redeemed_at DESC
    `,
    [normalizedAddress]
  );

  return result.rows;
}

/**
 * Get redemptions for a user/token in a specific period
 */
export async function getRedemptionsInPeriod(
  userAddress: string,
  tokenAddress: string,
  periodStart: Date
): Promise<Redemption[]> {
  const normalizedUserAddress = userAddress.toLowerCase();
  const normalizedTokenAddress = tokenAddress.toLowerCase();

  const result = await pool.query(
    `
    SELECT 
      id,
      user_address as "userAddress",
      token_address as "tokenAddress",
      amount,
      tx_hash as "txHash",
      redeemed_at as "redeemedAt",
      period_start as "periodStart"
    FROM redemptions 
    WHERE user_address = $1 
      AND token_address = $2 
      AND period_start = $3
    ORDER BY redeemed_at DESC
    `,
    [normalizedUserAddress, normalizedTokenAddress, periodStart]
  );

  return result.rows;
}
