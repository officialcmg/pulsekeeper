# PulseKeeper 💓

**Dead Man's Switch for Crypto Assets** — Automatically distribute your funds to designated backups if you become inactive.

Built with MetaMask Smart Accounts, EIP-7710 Delegations, and EIP-7702 Account Abstraction.

## 🎯 Problem

What happens to your crypto when you're gone? Traditional finance has beneficiaries, trusts, and estate planning. Crypto has... nothing. Your funds could be locked forever.

## 💡 Solution

PulseKeeper is a dead man's switch that:
1. **Monitors your activity** via periodic check-ins
2. **Distributes funds automatically** to your designated backups when you miss a deadline
3. **Uses advanced permissions** so you stay in full control until distribution

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Contracts  │
│   (Next.js) │     │  (Express)  │     │  (Solidity) │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       └───────────▶│   Indexer   │◀───────────┘
                    │   (Envio)   │
                    └─────────────┘
```

### Components

- **Frontend** (`/frontend`): Next.js 15 app with MetaMask SDK integration
- **Backend** (`/backend`): Express server handling permission storage and automated redemptions
- **Contracts** (`/contracts`): Solidity contracts for registry and transfer enforcers
- **Indexer** (`/indexer`): Envio HyperIndex for real-time event tracking

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 19, TailwindCSS, wagmi, viem |
| Backend | Express, TypeScript, PostgreSQL, EIP-7710 |
| Contracts | Solidity, Foundry, EIP-7702 |
| Indexer | Envio HyperIndex, GraphQL |
| Wallet | MetaMask Smart Accounts |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL
- MetaMask Flask (for Smart Account features)

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/pulsekeeper.git
cd pulsekeeper

# Install all dependencies
cd frontend && pnpm install && cd ..
cd backend && pnpm install && cd ..
cd contracts && forge install && cd ..
cd indexer && pnpm install && cd ..
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/pulsekeeper
SESSION_ACCOUNT_PRIVATE_KEY=0x...  # EIP-7702 upgraded EOA
PIMLICO_API_KEY=your_pimlico_key
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_INDEXER_URL=https://indexer.dev.hyperindex.xyz/555fb6b/v1/graphql
```

### 3. Deploy Contracts (Sepolia)

```bash
cd contracts
forge script script/DeployAll.s.sol --rpc-url sepolia --broadcast
```

### 4. Start Services

```bash
# Terminal 1: Backend
cd backend && pnpm dev

# Terminal 2: Frontend
cd frontend && pnpm dev

# Terminal 3: Indexer (optional, for real-time events)
cd indexer && pnpm dev
```

### 5. Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Indexer GraphQL: https://indexer.dev.hyperindex.xyz/555fb6b/v1/graphql

## 📋 How It Works

### User Flow

1. **Connect Wallet** — Connect MetaMask Smart Account
2. **Configure Pulse** — Set check-in period (e.g., 30 days)
3. **Add Backups** — Designate addresses + allocation percentages
4. **Grant Permissions** — Create EIP-7710 delegations for tokens
5. **Check In** — Reset the timer before deadline
6. **Distribution** — If deadline passes, funds flow to backups

### Smart Contracts

| Contract | Address (Sepolia) | Purpose |
|----------|-------------------|---------|
| PulseKeeperRegistry | `0x...` | User registration, check-ins, backup management |
| ERC20PeriodTransferEnforcer | `0x...` | Rate-limited ERC20 transfers |
| NativeTokenPeriodTransferEnforcer | `0x...` | Rate-limited ETH transfers |

### Key Features

- **⏰ Configurable Periods** — Set any check-in frequency
- **👥 Multiple Backups** — Split funds across multiple addresses
- **🔐 Permission-Based** — Uses EIP-7710 delegations, not custody
- **⛽ Gasless Redemption** — Backend sponsors gas via paymaster
- **📊 Real-time Tracking** — Indexer provides live event updates

## 🔌 API Endpoints

### Backend

```
POST /api/permissions/store     — Store user permissions
GET  /api/permissions/:address  — Get permissions for user
POST /api/distribution/run      — Trigger distribution check for all users
POST /api/distribution/redeem   — Manual redemption for specific user
GET  /api/distribution/redemptions/:address — Get redemption history
GET  /health                    — Health check
```

### GraphQL (Indexer)

```graphql
subscription {
  PulseKeeperRegistry_CheckIn(order_by: {timestamp: desc}, limit: 1) {
    user
    timestamp
    deadline
  }
}
```

## 🛡️ Security

- **Non-Custodial** — Users retain full control; permissions can be revoked anytime
- **Rate-Limited** — Enforcers limit transfer amounts per period
- **Deadline-Gated** — Transfers only possible after deadline passes
- **Open Source** — All contracts verified and auditable

## 📁 Project Structure

```
pulsekeeper/
├── frontend/           # Next.js frontend
│   ├── src/
│   │   ├── app/        # Pages (/, /redemptions)
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom hooks
│   │   └── providers/  # Context providers
│   └── ...
├── backend/            # Express backend
│   ├── src/
│   │   ├── api/        # Route handlers
│   │   ├── db/         # Database queries
│   │   ├── services/   # Business logic
│   │   └── config/     # Configuration
│   └── ...
├── contracts/          # Solidity contracts
│   ├── src/            # Contract source
│   ├── script/         # Deploy scripts
│   └── test/           # Contract tests
├── indexer/            # Envio indexer
│   ├── src/            # Event handlers
│   ├── schema.graphql  # GraphQL schema
│   └── config.yaml     # Indexer config
└── README.md
```

## 🧪 Testing

```bash
# Contract tests
cd contracts && forge test

# Backend (manual)
curl http://localhost:3001/health
```

## 🚧 Development Notes

- **Session Account**: Backend uses an EIP-7702 upgraded EOA for redemptions
- **Bundler**: Pimlico bundler for UserOp submission
- **Paymaster**: Pimlico paymaster for gas sponsorship
- **Indexer**: Deployed on Envio hosted service

## 📜 License

MIT

## 🙏 Acknowledgments

- [MetaMask](https://metamask.io/) — Smart Accounts & Delegation Framework
- [Envio](https://envio.dev/) — HyperIndex for blazing fast indexing
- [Pimlico](https://pimlico.io/) — Bundler & Paymaster infrastructure

---

**Built for MetaMask Hackathon 2025** 🦊
