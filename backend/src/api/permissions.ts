import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { storePermission, getPermissionsForUser, deactivatePermission } from '../db/permissions.js';
import { getAllowanceSummary } from '../services/amountChecker.js';

export const permissionsRouter: RouterType = Router();

// Schema for storing a permission
const StorePermissionSchema = z.object({
  userAddress: z.string(),
  tokenAddress: z.string(),
  permissionsContext: z.string(),
  delegationManager: z.string(),
  periodAmount: z.string(),
  periodDurationSeconds: z.number(),
  expiresAt: z.string().optional(),
});

/**
 * Store a permission from a user
 * Called by frontend after user grants permission
 */
permissionsRouter.post('/store', async (req, res) => {
  try {
    const data = StorePermissionSchema.parse(req.body);

    await storePermission({
      userAddress: data.userAddress,
      tokenAddress: data.tokenAddress,
      permissionsContext: data.permissionsContext,
      delegationManager: data.delegationManager,
      periodAmount: data.periodAmount,
      periodDurationSeconds: data.periodDurationSeconds,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    console.log(`✅ Stored permission for user: ${data.userAddress}, token: ${data.tokenAddress}`);

    res.json({ 
      success: true,
      message: 'Permission stored successfully',
      userAddress: data.userAddress,
      tokenAddress: data.tokenAddress,
    });

  } catch (error) {
    console.error('Error storing permission:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid payload', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to store permission' });
  }
});

/**
 * Get all permissions for a user
 */
permissionsRouter.get('/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;

    const permissions = await getPermissionsForUser(userAddress.toLowerCase());

    res.json({ 
      success: true,
      userAddress,
      permissions,
    });

  } catch (error) {
    console.error('Error retrieving permissions:', error);
    res.status(500).json({ error: 'Failed to retrieve permissions' });
  }
});

/**
 * Get allowance summary for a user (available amounts per token)
 */
permissionsRouter.get('/:userAddress/allowances', async (req, res) => {
  try {
    const { userAddress } = req.params;

    const summary = await getAllowanceSummary(userAddress.toLowerCase());

    res.json({ 
      success: true,
      ...summary,
    });

  } catch (error) {
    console.error('Error getting allowance summary:', error);
    res.status(500).json({ error: 'Failed to get allowance summary' });
  }
});

/**
 * Deactivate a permission for a user/token
 */
permissionsRouter.delete('/:userAddress/:tokenAddress', async (req, res) => {
  try {
    const { userAddress, tokenAddress } = req.params;

    await deactivatePermission(userAddress.toLowerCase(), tokenAddress.toLowerCase());

    console.log(`🗑️ Deactivated permission for user: ${userAddress}, token: ${tokenAddress}`);

    res.json({ 
      success: true,
      message: 'Permission deactivated',
      userAddress,
      tokenAddress,
    });

  } catch (error) {
    console.error('Error deactivating permission:', error);
    res.status(500).json({ error: 'Failed to deactivate permission' });
  }
});
