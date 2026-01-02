import { pool } from './index.js';

export interface StoredPermission {
  id: number;
  userAddress: string;
  tokenAddress: string;
  permissionsContext: string;
  delegationManager: string;
  periodAmount: string;
  periodDurationSeconds: number;
  grantedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface CreatePermissionParams {
  userAddress: string;
  tokenAddress: string;
  permissionsContext: string;
  delegationManager: string;
  periodAmount: string;
  periodDurationSeconds: number;
  expiresAt?: Date;
}

/**
 * Store a permission for a user
 */
export async function storePermission(params: CreatePermissionParams): Promise<void> {
  const {
    userAddress,
    tokenAddress,
    permissionsContext,
    delegationManager,
    periodAmount,
    periodDurationSeconds,
    expiresAt,
  } = params;

  const normalizedUserAddress = userAddress.toLowerCase();
  const normalizedTokenAddress = tokenAddress.toLowerCase();

  await pool.query(
    `
    INSERT INTO permissions (
      user_address, token_address, permissions_context, delegation_manager,
      period_amount, period_duration_seconds, granted_at, expires_at, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, TRUE)
    ON CONFLICT (user_address, token_address)
    DO UPDATE SET 
      permissions_context = $3,
      delegation_manager = $4,
      period_amount = $5,
      period_duration_seconds = $6,
      granted_at = NOW(),
      expires_at = $7,
      is_active = TRUE,
      updated_at = NOW()
    `,
    [
      normalizedUserAddress,
      normalizedTokenAddress,
      permissionsContext,
      delegationManager,
      periodAmount,
      periodDurationSeconds,
      expiresAt || null,
    ]
  );
}

/**
 * Get all active permissions for a user
 */
export async function getPermissionsForUser(userAddress: string): Promise<StoredPermission[]> {
  const normalizedAddress = userAddress.toLowerCase();

  const result = await pool.query(
    `
    SELECT 
      id,
      user_address as "userAddress",
      token_address as "tokenAddress",
      permissions_context as "permissionsContext",
      delegation_manager as "delegationManager",
      period_amount as "periodAmount",
      period_duration_seconds as "periodDurationSeconds",
      granted_at as "grantedAt",
      expires_at as "expiresAt",
      is_active as "isActive"
    FROM permissions 
    WHERE user_address = $1 AND is_active = TRUE
    `,
    [normalizedAddress]
  );

  return result.rows;
}

/**
 * Get a specific permission for a user and token
 */
export async function getPermission(
  userAddress: string,
  tokenAddress: string
): Promise<StoredPermission | null> {
  const normalizedUserAddress = userAddress.toLowerCase();
  const normalizedTokenAddress = tokenAddress.toLowerCase();

  const result = await pool.query(
    `
    SELECT 
      id,
      user_address as "userAddress",
      token_address as "tokenAddress",
      permissions_context as "permissionsContext",
      delegation_manager as "delegationManager",
      period_amount as "periodAmount",
      period_duration_seconds as "periodDurationSeconds",
      granted_at as "grantedAt",
      expires_at as "expiresAt",
      is_active as "isActive"
    FROM permissions 
    WHERE user_address = $1 AND token_address = $2 AND is_active = TRUE
    `,
    [normalizedUserAddress, normalizedTokenAddress]
  );

  return result.rows[0] || null;
}

/**
 * Get all users with active permissions
 */
export async function getAllUsersWithPermissions(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT user_address FROM permissions WHERE is_active = TRUE`
  );

  return result.rows.map((row) => row.user_address);
}

/**
 * Deactivate a permission
 */
export async function deactivatePermission(
  userAddress: string,
  tokenAddress: string
): Promise<void> {
  const normalizedUserAddress = userAddress.toLowerCase();
  const normalizedTokenAddress = tokenAddress.toLowerCase();

  await pool.query(
    `
    UPDATE permissions 
    SET is_active = FALSE, updated_at = NOW()
    WHERE user_address = $1 AND token_address = $2
    `,
    [normalizedUserAddress, normalizedTokenAddress]
  );
}

/**
 * Deactivate all permissions for a user
 */
export async function deactivateAllPermissionsForUser(userAddress: string): Promise<void> {
  const normalizedAddress = userAddress.toLowerCase();

  await pool.query(
    `
    UPDATE permissions 
    SET is_active = FALSE, updated_at = NOW()
    WHERE user_address = $1
    `,
    [normalizedAddress]
  );
}
