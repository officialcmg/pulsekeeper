import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { runDistributionCheck, checkUserDistributionStatus, getAllUsersDistributionStatus } from '../services/distributionService.js';
import { redeemForUser } from '../services/redemptionService.js';

export const distributionRouter: RouterType = Router();

/**
 * Run distribution check for all users
 * This checks all registered users and triggers redemption for those past their deadline
 */
distributionRouter.post('/run', async (req, res) => {
  try {
    console.log('\n🚀 Distribution run triggered via API');
    
    const result = await runDistributionCheck();

    res.json({ 
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error('Error running distribution:', error);
    res.status(500).json({ 
      error: 'Failed to run distribution',
      message: error.message,
    });
  }
});

/**
 * Check distribution status for a specific user
 */
distributionRouter.get('/status/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;

    const status = await checkUserDistributionStatus(userAddress.toLowerCase());

    res.json({ 
      success: true,
      ...status,
    });

  } catch (error: any) {
    console.error('Error checking distribution status:', error);
    res.status(500).json({ 
      error: 'Failed to check distribution status',
      message: error.message,
    });
  }
});

/**
 * Get distribution status for all users
 */
distributionRouter.get('/status', async (req, res) => {
  try {
    const statuses = await getAllUsersDistributionStatus();

    res.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      users: statuses,
    });

  } catch (error: any) {
    console.error('Error getting all distribution statuses:', error);
    res.status(500).json({ 
      error: 'Failed to get distribution statuses',
      message: error.message,
    });
  }
});

// Schema for manual redemption
const ManualRedeemSchema = z.object({
  userAddress: z.string(),
});

/**
 * Manually trigger redemption for a specific user
 * Useful for testing or manual intervention
 */
distributionRouter.post('/redeem', async (req, res) => {
  try {
    const { userAddress } = ManualRedeemSchema.parse(req.body);

    console.log(`\n🔧 Manual redemption triggered for ${userAddress}`);

    const result = await redeemForUser(userAddress.toLowerCase());

    res.json(result);

  } catch (error: any) {
    console.error('Error in manual redemption:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid payload', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to redeem',
      message: error.message,
    });
  }
});
