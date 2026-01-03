import {
  PulseKeeperRegistry,
  ERC20TransferAmountEnforcer,
  NativeTokenTransferAmountEnforcer,
} from "../generated";
import type {
  RegisteredUser,
  Backup,
  Distribution,
  CheckInEvent,
  GlobalStats,
} from "../generated";

const GLOBAL_STATS_ID = "global";

// Helper to get or create global stats
async function getOrCreateGlobalStats(context: any): Promise<GlobalStats> {
  let stats = await context.GlobalStats.get(GLOBAL_STATS_ID);
  if (!stats) {
    stats = {
      id: GLOBAL_STATS_ID,
      totalUsers: 0,
      totalDistributions: 0,
      totalCheckIns: 0,
    };
    context.GlobalStats.set(stats);
  }
  return stats;
}

// ============================================
// PulseKeeperRegistry Event Handlers
// ============================================

PulseKeeperRegistry.UserRegistered.handler(async ({ event, context }) => {
  const userId = event.params.user.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // Create the registered user
  const user: RegisteredUser = {
    id: userId,
    pulsePeriodSeconds: event.params.pulsePeriodSeconds,
    lastCheckIn: event.params.timestamp,
    deadline: event.params.deadline,
    registeredAt: timestamp,
    updatedAt: timestamp,
  };
  context.RegisteredUser.set(user);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  context.GlobalStats.set({
    ...stats,
    totalUsers: stats.totalUsers + 1,
  });

  context.log.info(`User registered: ${userId}`);
});

PulseKeeperRegistry.CheckIn.handler(async ({ event, context }) => {
  const userId = event.params.user.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // Get existing user
  const user = await context.RegisteredUser.get(userId);
  if (!user) {
    context.log.warn(`CheckIn for unregistered user: ${userId}`);
    return;
  }

  // Update user
  context.RegisteredUser.set({
    ...user,
    lastCheckIn: event.params.timestamp,
    deadline: event.params.deadline,
    updatedAt: timestamp,
  });

  // Create check-in event record
  const txHash = (event.transaction as any).hash || event.block.hash;
  const checkInId = `${event.block.number}-${event.logIndex}`;
  const checkInEvent: CheckInEvent = {
    id: checkInId,
    user_id: userId,
    timestamp: event.params.timestamp,
    newDeadline: event.params.deadline,
    txHash: txHash,
    blockNumber: BigInt(event.block.number),
  };
  context.CheckInEvent.set(checkInEvent);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  context.GlobalStats.set({
    ...stats,
    totalCheckIns: stats.totalCheckIns + 1,
  });
});

PulseKeeperRegistry.BackupsUpdated.handler(async ({ event, context }) => {
  const userId = event.params.user.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // Get existing user
  const user = await context.RegisteredUser.get(userId);
  if (!user) {
    context.log.warn(`BackupsUpdated for unregistered user: ${userId}`);
    return;
  }

  // Update user timestamp
  context.RegisteredUser.set({
    ...user,
    updatedAt: timestamp,
  });

  // Delete old backups and create new ones
  // Note: We use a composite ID to track backups
  // Backup tuple is [address, allocationBps]
  for (const backup of event.params.backups) {
    const backupAddr = (backup as any)[0] || backup;
    const backupBps = (backup as any)[1] || 0;
    const backupId = `${userId}-${String(backupAddr).toLowerCase()}`;
    const backupEntity: Backup = {
      id: backupId,
      user_id: userId,
      address: String(backupAddr).toLowerCase(),
      allocationBps: Number(backupBps),
      createdAt: timestamp,
    };
    context.Backup.set(backupEntity);
  }
});

PulseKeeperRegistry.PulsePeriodUpdated.handler(async ({ event, context }) => {
  const userId = event.params.user.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // Get existing user
  const user = await context.RegisteredUser.get(userId);
  if (!user) {
    context.log.warn(`PulsePeriodUpdated for unregistered user: ${userId}`);
    return;
  }

  // Update user
  context.RegisteredUser.set({
    ...user,
    pulsePeriodSeconds: event.params.pulsePeriodSeconds,
    deadline: event.params.newDeadline,
    updatedAt: timestamp,
  });
});

// ============================================
// ERC20 Enforcer Event Handler
// ============================================

ERC20TransferAmountEnforcer.TransferredInPeriod.handler(async ({ event, context }) => {
  // The delegator is the user who granted the permission
  const delegatorAddress = event.params.delegator.toLowerCase();
  
  // Check if the delegator is a registered PulseKeeper user
  const user = await context.RegisteredUser.get(delegatorAddress);
  if (!user) {
    // Not a registered PulseKeeper user, skip
    return;
  }

  const txHash = (event.transaction as any).hash || event.block.hash;
  const distributionId = `${event.block.number}-${event.logIndex}`;

  const distribution: Distribution = {
    id: distributionId,
    user_id: delegatorAddress,
    recipient: "backup", // The actual recipient is determined by our backend logic
    token: event.params.token.toLowerCase(),
    tokenType: "ERC20",
    amount: event.params.amount,
    txHash: txHash,
    blockNumber: BigInt(event.block.number),
    timestamp: event.params.timestamp,
  };
  context.Distribution.set(distribution);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  context.GlobalStats.set({
    ...stats,
    totalDistributions: stats.totalDistributions + 1,
  });

  context.log.info(`ERC20 Distribution: ${event.params.amount} of ${event.params.token} from ${delegatorAddress}`);
});

// ============================================
// Native Token Enforcer Event Handler
// ============================================

NativeTokenTransferAmountEnforcer.NativeTransferredInPeriod.handler(async ({ event, context }) => {
  // The delegator is the user who granted the permission
  const delegatorAddress = event.params.delegator.toLowerCase();
  
  // Check if the delegator is a registered PulseKeeper user
  const user = await context.RegisteredUser.get(delegatorAddress);
  if (!user) {
    // Not a registered PulseKeeper user, skip
    return;
  }

  const txHash = (event.transaction as any).hash || event.block.hash;
  const distributionId = `${event.block.number}-${event.logIndex}`;

  const distribution: Distribution = {
    id: distributionId,
    user_id: delegatorAddress,
    recipient: "backup", // The actual recipient is determined by our backend logic
    token: "0x0000000000000000000000000000000000000000", // Native ETH
    tokenType: "NATIVE",
    amount: event.params.amount,
    txHash: txHash,
    blockNumber: BigInt(event.block.number),
    timestamp: event.params.timestamp,
  };
  context.Distribution.set(distribution);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  context.GlobalStats.set({
    ...stats,
    totalDistributions: stats.totalDistributions + 1,
  });

  context.log.info(`Native Distribution: ${event.params.amount} ETH from ${delegatorAddress}`);
});
