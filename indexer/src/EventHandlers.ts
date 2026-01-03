/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  PulseKeeperRegistry,
  PulseKeeperRegistry_UserRegistered,
  PulseKeeperRegistry_CheckIn,
  PulseKeeperRegistry_BackupsUpdated,
  PulseKeeperRegistry_PulsePeriodUpdated,
  ERC20PeriodTransferEnforcer,
  ERC20PeriodTransferEnforcer_TransferredInPeriod,
  NativeTokenPeriodTransferEnforcer,
  NativeTokenPeriodTransferEnforcer_TransferredInPeriod,
} from "generated";

// PulseKeeperRegistry Handlers
PulseKeeperRegistry.UserRegistered.handler(async ({ event, context }) => {
  const entity: PulseKeeperRegistry_UserRegistered = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    pulsePeriodSeconds: event.params.pulsePeriodSeconds,
    timestamp: event.params.timestamp,
    deadline: event.params.deadline,
  };
  context.PulseKeeperRegistry_UserRegistered.set(entity);
});

PulseKeeperRegistry.CheckIn.handler(async ({ event, context }) => {
  const entity: PulseKeeperRegistry_CheckIn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    timestamp: event.params.timestamp,
    deadline: event.params.deadline,
  };
  context.PulseKeeperRegistry_CheckIn.set(entity);
});

PulseKeeperRegistry.BackupsUpdated.handler(async ({ event, context }) => {
  const entity: PulseKeeperRegistry_BackupsUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
  };
  context.PulseKeeperRegistry_BackupsUpdated.set(entity);
});

PulseKeeperRegistry.PulsePeriodUpdated.handler(async ({ event, context }) => {
  const entity: PulseKeeperRegistry_PulsePeriodUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    pulsePeriodSeconds: event.params.pulsePeriodSeconds,
    newDeadline: event.params.newDeadline,
  };
  context.PulseKeeperRegistry_PulsePeriodUpdated.set(entity);
});

// ERC20 Enforcer Handler
ERC20PeriodTransferEnforcer.TransferredInPeriod.handler(async ({ event, context }) => {
  const entity: ERC20PeriodTransferEnforcer_TransferredInPeriod = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    redeemer: event.params.redeemer,
    delegationHash: event.params.delegationHash,
    token: event.params.token,
    periodAmount: event.params.periodAmount,
    periodDuration: event.params.periodDuration,
    startDate: event.params.startDate,
    transferredInCurrentPeriod: event.params.transferredInCurrentPeriod,
    transferTimestamp: event.params.transferTimestamp,
  };

  context.ERC20PeriodTransferEnforcer_TransferredInPeriod.set(entity);
});

NativeTokenPeriodTransferEnforcer.TransferredInPeriod.handler(async ({ event, context }) => {
  const entity: NativeTokenPeriodTransferEnforcer_TransferredInPeriod = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    redeemer: event.params.redeemer,
    delegationHash: event.params.delegationHash,
    periodAmount: event.params.periodAmount,
    periodDuration: event.params.periodDuration,
    startDate: event.params.startDate,
    transferredInCurrentPeriod: event.params.transferredInCurrentPeriod,
    transferTimestamp: event.params.transferTimestamp,
  };

  context.NativeTokenPeriodTransferEnforcer_TransferredInPeriod.set(entity);
});
