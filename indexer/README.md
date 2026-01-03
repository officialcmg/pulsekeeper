# PulseKeeper Indexer

Envio HyperIndex indexer for tracking PulseKeeper distributions and user activity.

## Entities

- **RegisteredUser** - Users registered with PulseKeeper
- **Backup** - Backup addresses for each user
- **Distribution** - Token distributions (ERC20 and Native ETH)
- **CheckInEvent** - User check-in history
- **GlobalStats** - Aggregate statistics

## Contracts Indexed

| Contract | Address (Sepolia) |
|----------|-------------------|
| PulseKeeperRegistry | `0x82C1A7C28FA5b364893D6c124D93CBb2E02910e9` |
| ERC20TransferAmountEnforcer | `0x474e3ae7e169e940607cc624da8a15eb120139ab` |
| NativeTokenTransferAmountEnforcer | `0x9bc0faf4aca5ae429f4c06aeeac517520cb16bd9` |

## Development

```bash
# Install dependencies
pnpm install

# Generate types
pnpm envio codegen

# Run locally (requires Docker)
pnpm envio dev
```

## Deployment

Deploy to [Envio Hosted Service](https://envio.dev):

1. Go to https://envio.dev
2. Sign in with GitHub
3. Create new indexer from this repo
4. Select the `indexer/` directory
5. Deploy

## GraphQL Queries

Once deployed, query the indexer:

```graphql
# Get all registered users
query {
  RegisteredUser {
    id
    pulsePeriodSeconds
    deadline
    lastCheckIn
  }
}

# Get distributions for a user
query {
  Distribution(where: { user_id: { _eq: "0x..." } }) {
    token
    tokenType
    amount
    timestamp
  }
}
```
