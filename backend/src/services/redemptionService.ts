import { createBundlerClient } from 'viem/account-abstraction';
import { encodeFunctionData, http, type Address, type Hex, createClient } from 'viem';
import { toMetaMaskSmartAccount, Implementation } from '@metamask/smart-accounts-kit';
import { erc7710BundlerActions } from '@metamask/smart-accounts-kit/actions';
import { publicClient, sessionAccount } from '../config/clients.js';
import { CHAIN, PIMLICO_BUNDLER_URL, ERC20_TRANSFER_ABI, PULSEKEEPER_REGISTRY_ADDRESS, PULSEKEEPER_REGISTRY_ABI } from '../config/constants.js';
import { getAvailableAmounts, TokenAllowance } from './amountChecker.js';
import { getPermissionsForUser, StoredPermission } from '../db/permissions.js';
import { recordRedemption } from '../db/redemptions.js';

export interface BackupAllocation {
  address: Address;
  allocationBps: number;
}

export interface RedemptionResult {
  success: boolean;
  userAddress: string;
  distributions: Array<{
    tokenAddress: string;
    backupAddress: string;
    amount: string;
    txHash?: string;
    error?: string;
  }>;
  errors: string[];
}

/**
 * Get backup allocations from the PulseKeeper Registry contract
 */
async function getBackupAllocations(userAddress: Address): Promise<BackupAllocation[]> {
  const backups = await publicClient.readContract({
    address: PULSEKEEPER_REGISTRY_ADDRESS,
    abi: PULSEKEEPER_REGISTRY_ABI,
    functionName: 'getBackups',
    args: [userAddress],
  });

  return backups.map((b) => ({
    address: b.addr,
    allocationBps: b.allocationBps,
  }));
}

/**
 * Check if a user is in distribution mode (deadline passed)
 */
export async function isUserDistributing(userAddress: Address): Promise<boolean> {
  return await publicClient.readContract({
    address: PULSEKEEPER_REGISTRY_ADDRESS,
    abi: PULSEKEEPER_REGISTRY_ABI,
    functionName: 'isDistributing',
    args: [userAddress],
  });
}

/**
 * Create the MetaMask Smart Account for the session
 * Uses EIP-7702 Stateless implementation - EOA must be upgraded first!
 * Run scripts/upgradeEOAto7702.ts to upgrade the EOA before using this.
 */
async function createSessionSmartAccount() {
  if (!sessionAccount) {
    throw new Error('Session account not configured');
  }

  // Use Stateless7702 implementation - the EOA address IS the smart account address
  // The EOA must have been upgraded via EIP-7702 authorization first
  return await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: sessionAccount.address, // Address of the upgraded EOA
    signer: { account: sessionAccount },
  });
}

/**
 * Create bundler client with ERC-7710 actions and paymaster for gas sponsorship
 */
function createRedemptionBundlerClient() {
  return createBundlerClient({
    client: publicClient,
    transport: http(PIMLICO_BUNDLER_URL),
    paymaster: true, // Enable Pimlico paymaster for gas sponsorship
  }).extend(erc7710BundlerActions());
}

/**
 * Calculate amount to send to each backup based on allocation
 */
function calculateBackupAmounts(
  totalAmount: bigint,
  backups: BackupAllocation[]
): Map<Address, bigint> {
  const amounts = new Map<Address, bigint>();
  
  for (const backup of backups) {
    // allocationBps is in basis points (10000 = 100%)
    const amount = (totalAmount * BigInt(backup.allocationBps)) / 10000n;
    amounts.set(backup.address, amount);
  }

  return amounts;
}

/**
 * Build ERC20 transfer calldata
 */
function buildTransferCalldata(to: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [to, amount],
  });
}

/**
 * Build native ETH transfer call
 */
function buildNativeTransferCall(
  to: Address,
  amount: bigint,
  permissionsContext: Hex,
  delegationManager: Address
) {
  return {
    to,
    data: '0x' as Hex,
    value: amount,
    permissionsContext,
    delegationManager,
  };
}

/**
 * Build ERC20 transfer call
 */
function buildErc20TransferCall(
  tokenAddress: Address,
  to: Address,
  amount: bigint,
  permissionsContext: Hex,
  delegationManager: Address
) {
  return {
    to: tokenAddress,
    data: buildTransferCalldata(to, amount),
    value: 0n,
    permissionsContext,
    delegationManager,
  };
}

/**
 * Record distribution on-chain for indexer tracking
 * Calls the recordDistribution function on the PulseKeeperRegistry contract
 */
async function recordDistributionOnChain(
  userAddress: Address,
  tokenAddress: Address,
  backupAddresses: Address[],
  amounts: bigint[],
  sessionSmartAccount: Awaited<ReturnType<typeof createSessionSmartAccount>>,
  bundlerClient: ReturnType<typeof createRedemptionBundlerClient>
) {
  const callData = encodeFunctionData({
    abi: PULSEKEEPER_REGISTRY_ABI,
    functionName: 'recordDistribution',
    args: [userAddress, tokenAddress, backupAddresses, amounts],
  });

  const fee = {
    maxFeePerGas: 50000000000n,
    maxPriorityFeePerGas: 5000000000n,
  };

  const userOpHash = await bundlerClient.sendUserOperation({
    account: sessionSmartAccount,
    calls: [{
      to: PULSEKEEPER_REGISTRY_ADDRESS,
      data: callData,
    }],
    ...fee,
  });

  await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
}

/**
 * Main redemption service function
 * Takes a user address and redeems all available permissions to their backups
 * 
 * This is the core logic that:
 * 1. Gets available amounts from the amount checker service
 * 2. Gets permissions from the database
 * 3. Gets backup allocations from the contract
 * 4. Redeems permissions using the bundler client
 */
export async function redeemForUser(userAddress: string): Promise<RedemptionResult> {
  const result: RedemptionResult = {
    success: false,
    userAddress,
    distributions: [],
    errors: [],
  };

  try {
    const userAddr = userAddress as Address;

    // Step 1: Check if user is in distribution mode
    const isDistributing = await isUserDistributing(userAddr);
    if (!isDistributing) {
      result.errors.push('User is not in distribution mode (deadline not passed)');
      return result;
    }

    // Step 2: Get available amounts for all tokens
    const availableAmounts = await getAvailableAmounts(userAddress);
    if (availableAmounts.length === 0) {
      result.errors.push('No permissions found for user');
      return result;
    }

    // Filter to only tokens with available amounts
    const tokensToRedeem = availableAmounts.filter((a) => a.availableToRedeem > 0n);
    if (tokensToRedeem.length === 0) {
      result.errors.push('No available amounts to redeem in current period');
      return result;
    }

    // Step 3: Get backup allocations from contract
    const backups = await getBackupAllocations(userAddr);
    if (backups.length === 0) {
      result.errors.push('No backup addresses configured for user');
      return result;
    }

    console.log(`📤 Redeeming for user ${userAddress}`);
    console.log(`   Tokens to redeem: ${tokensToRedeem.length}`);
    console.log(`   Backups: ${backups.length}`);

    // Step 4: Create session smart account and bundler client
    const sessionSmartAccount = await createSessionSmartAccount();
    const bundlerClient = createRedemptionBundlerClient();

    // Step 5: Build calls for each token and each backup
    for (const tokenAllowance of tokensToRedeem) {
      const { tokenAddress, availableToRedeem, permission, periodStart } = tokenAllowance;
      
      // Calculate amounts for each backup
      const backupAmounts = calculateBackupAmounts(availableToRedeem, backups);

      // Build calls for this token
      const calls = [];
      const isNativeToken = tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

      for (const [backupAddr, amount] of backupAmounts) {
        if (amount === 0n) continue;

        const permissionsContext = permission.permissionsContext as Hex;
        const delegationManager = permission.delegationManager as Address;

        if (isNativeToken) {
          calls.push(buildNativeTransferCall(backupAddr, amount, permissionsContext, delegationManager));
        } else {
          calls.push(buildErc20TransferCall(
            tokenAddress as Address,
            backupAddr,
            amount,
            permissionsContext,
            delegationManager
          ));
        }

        result.distributions.push({
          tokenAddress,
          backupAddress: backupAddr,
          amount: amount.toString(),
        });
      }

      if (calls.length === 0) continue;

      try {
        // Step 6: Send user operation with delegation
        console.log(`   🚀 Sending redemption for token ${tokenAddress}...`);
        
        // Get gas prices - use reasonable defaults for Sepolia
        const fee = {
          maxFeePerGas: 50000000000n, // 50 gwei
          maxPriorityFeePerGas: 5000000000n, // 5 gwei
        };

        const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
          publicClient,
          account: sessionSmartAccount,
          calls,
          ...fee,
        });

        console.log(`   📝 UserOp hash: ${userOpHash}`);

        // Wait for receipt
        const { receipt } = await bundlerClient.waitForUserOperationReceipt({
          hash: userOpHash,
        });

        console.log(`   ✅ Confirmed in tx: ${receipt.transactionHash}`);

        // Update distributions with tx hash
        for (const dist of result.distributions) {
          if (dist.tokenAddress === tokenAddress && !dist.txHash) {
            dist.txHash = receipt.transactionHash;
          }
        }

        // Record distribution on-chain for indexer
        try {
          const backupAddresses = Array.from(backupAmounts.keys());
          const amounts = Array.from(backupAmounts.values());
          // Use address(0) for native ETH, actual token address for ERC20
          const tokenForEvent = isNativeToken ? '0x0000000000000000000000000000000000000000' as Address : tokenAddress as Address;
          
          await recordDistributionOnChain(
            userAddr,
            tokenForEvent,
            backupAddresses,
            amounts,
            sessionSmartAccount,
            bundlerClient
          );
          console.log(`   📊 Distribution recorded on-chain for indexer`);
        } catch (recordError: any) {
          console.warn(`   ⚠️ Failed to record distribution on-chain: ${recordError.message}`);
        }

        // Record redemption in database
        await recordRedemption({
          userAddress,
          tokenAddress,
          amount: availableToRedeem.toString(),
          txHash: receipt.transactionHash,
          periodStart,
        });

      } catch (error: any) {
        console.error(`   ❌ Error redeeming token ${tokenAddress}:`, error.message);
        result.errors.push(`Failed to redeem ${tokenAddress}: ${error.message}`);
        
        // Update distributions with error
        for (const dist of result.distributions) {
          if (dist.tokenAddress === tokenAddress && !dist.txHash) {
            dist.error = error.message;
          }
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error: any) {
    console.error('Redemption error:', error);
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Redeem a specific amount for a specific token
 * Used for testing or partial redemptions
 */
export async function redeemSpecificAmount(
  userAddress: string,
  tokenAddress: string,
  amount: bigint
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const userAddr = userAddress as Address;
    const tokenAddr = tokenAddress as Address;

    // Get permission for this token
    const permissions = await getPermissionsForUser(userAddress);
    const permission = permissions.find(
      (p) => p.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!permission) {
      return { success: false, error: 'No permission found for this token' };
    }

    // Get backups
    const backups = await getBackupAllocations(userAddr);
    if (backups.length === 0) {
      return { success: false, error: 'No backup addresses configured' };
    }

    // Create session and bundler
    const sessionSmartAccount = await createSessionSmartAccount();
    const bundlerClient = createRedemptionBundlerClient();

    // Calculate amounts for each backup
    const backupAmounts = calculateBackupAmounts(amount, backups);

    // Build calls
    const calls = [];
    const isNativeToken = tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const permissionsContext = permission.permissionsContext as Hex;
    const delegationManager = permission.delegationManager as Address;

    for (const [backupAddr, backupAmount] of backupAmounts) {
      if (backupAmount === 0n) continue;

      if (isNativeToken) {
        calls.push(buildNativeTransferCall(backupAddr, backupAmount, permissionsContext, delegationManager));
      } else {
        calls.push(buildErc20TransferCall(tokenAddr, backupAddr, backupAmount, permissionsContext, delegationManager));
      }
    }

    // Send operation - use reasonable defaults for Sepolia
    const fee = {
      maxFeePerGas: 50000000000n, // 50 gwei
      maxPriorityFeePerGas: 5000000000n, // 5 gwei
    };

    const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
      publicClient,
      account: sessionSmartAccount,
      calls,
      ...fee,
    });

    const { receipt } = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    return { success: true, txHash: receipt.transactionHash };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
