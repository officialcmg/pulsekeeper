# PulseKeeper Contracts

Smart contracts for the PulseKeeper recovery system.

## Overview

The `PulseKeeperRegistry` contract tracks:
- User check-ins (pulse timestamps)
- Backup addresses with allocation percentages
- Pulse periods (how often users need to check in)

## Setup

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install dependencies:
```bash
forge install foundry-rs/forge-std
```

3. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your values
```

## Build

```bash
forge build
```

## Test

```bash
forge test
```

## Deploy to Sepolia

```bash
source .env
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

## Contract Functions

### User Functions

- `register(pulsePeriodDays, backups)` - Register with initial configuration
- `checkIn()` - Reset the pulse timer
- `setBackups(backups)` - Update backup addresses
- `setPulsePeriod(days)` - Update check-in frequency

### View Functions

- `getLastCheckIn(user)` - Get last check-in timestamp
- `getPulsePeriod(user)` - Get pulse period in days
- `getBackups(user)` - Get backup addresses
- `isActive(user)` - Check if user is within their pulse period
- `isDistributing(user)` - Check if distribution should be happening
- `getDeadline(user)` - Get the deadline timestamp
- `getUserConfig(user)` - Get full user configuration

## Backup Struct

```solidity
struct Backup {
    address addr;        // Backup wallet address
    uint16 allocationBps; // Allocation in basis points (10000 = 100%)
}
```

## Integration with Advanced Permissions

This contract works alongside MetaMask Advanced Permissions (ERC-7715). The flow:

1. User registers on PulseKeeperRegistry with backups and pulse period
2. User grants Advanced Permission to a session account
3. Session account monitors `isDistributing()` 
4. When user misses check-in, session account executes transfers using the granted permission
5. User can always check in to stop distribution
