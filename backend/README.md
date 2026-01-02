# PulseKeeper Backend

Backend service for PulseKeeper - handles permission storage and automated distribution redemption.

## Architecture

```
backend/
├── src/
│   ├── api/              # Express routes
│   │   ├── permissions.ts    # Store/retrieve permissions
│   │   └── distribution.ts   # Trigger distribution checks
│   ├── config/           # Configuration
│   │   ├── constants.ts      # Chain config, ABIs
│   │   └── clients.ts        # Viem clients
│   ├── db/               # Database layer
│   │   ├── index.ts          # Pool & init
│   │   ├── permissions.ts    # Permission CRUD
│   │   └── redemptions.ts    # Redemption tracking
│   ├── services/         # Business logic
│   │   ├── amountChecker.ts      # Calculate available amounts
│   │   ├── redemptionService.ts  # Execute redemptions
│   │   └── distributionService.ts # Check all users
│   └── index.ts          # Express app entry
├── test/
│   ├── index.ts              # Test runner
│   └── testRedemption.ts     # Redemption tests
└── package.json
```

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Set up PostgreSQL database and run migrations:
```bash
pnpm db:migrate
```

4. Start development server:
```bash
pnpm dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SESSION_PRIVATE_KEY` | Private key for session account (same as contracts deployer) |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint |
| `PIMLICO_API_KEY` | Pimlico bundler/paymaster API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `PULSEKEEPER_REGISTRY_ADDRESS` | Deployed registry contract address |
| `PORT` | Server port (default: 3001) |

## API Endpoints

### Permissions

- `POST /api/permissions/store` - Store a permission from frontend
- `GET /api/permissions/:userAddress` - Get all permissions for a user
- `GET /api/permissions/:userAddress/allowances` - Get available amounts per token
- `DELETE /api/permissions/:userAddress/:tokenAddress` - Deactivate a permission

### Distribution

- `POST /api/distribution/run` - Check all users and trigger redemptions
- `GET /api/distribution/status` - Get distribution status for all users
- `GET /api/distribution/status/:userAddress` - Get status for specific user
- `POST /api/distribution/redeem` - Manually trigger redemption for a user

## How It Works

### Permission Flow
1. Frontend grants Advanced Permission via MetaMask
2. Frontend calls `POST /api/permissions/store` with permission context
3. Backend stores permission in PostgreSQL

### Distribution Flow
1. Cron job or manual call to `POST /api/distribution/run`
2. Backend checks all users with stored permissions
3. For each user past their deadline (from contract):
   - Get available amounts (period amount - already redeemed)
   - Get backup allocations from contract
   - Build transfer calls for each backup
   - Execute via bundler with `sendUserOperationWithDelegation`
   - Record redemption in database

### Amount Tracking
- Each permission has a `periodAmount` and `periodDurationSeconds`
- Redemptions are tracked per period
- Available amount = periodAmount - sum(redemptions in current period)
- This prevents over-redemption within a period

## Testing

Run the redemption test:
```bash
pnpm test:redeem
```

## Deployment

Build for production:
```bash
pnpm build
pnpm start
```

Deploy to Railway:
1. Connect GitHub repo
2. Set environment variables
3. Deploy

## Session Account

The backend uses a single session account (from `SESSION_PRIVATE_KEY`) to:
- Sign user operations for redemptions
- Act as the delegate for all user permissions

**Important**: This same private key should be used when:
- Deploying contracts (for consistency)
- Users grant permissions (session account address must match)

Session Account Address: `0x0ECB4898FA0D5793f81D04248206cE5392cd850A`
