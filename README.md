# Backend Signer App

A pure backend implementation of Abstraxion SignerMode using in-memory storage and viem-based local wallets.

## Overview

This application demonstrates how to use Abstraxion's SignerMode in a Node.js backend environment without React or browser dependencies. It uses:

- **Memory Storage**: Temporary in-memory storage for session data
- **Viem Wallets**: Local wallets created using viem's `generatePrivateKey` and `privateKeyToAccount`
- **SignerController**: Abstraxion's controller for managing connections and grants

## Features

- ✅ Automatic smart account discovery/creation
- ✅ Automatic grants creation and management
- ✅ Session management with in-memory storage
- ✅ Simple API for connecting and sending transactions
- ✅ No browser dependencies

## Prerequisites

- Node.js 18+
- pnpm (package manager)

## Setup

1. Install dependencies:

```bash
pnpm install
```

1. Set required environment variables:

```bash
export CHECKSUM="your-smart-account-contract-checksum"
export FEE_GRANTER_ADDRESS="xion1..."
export CODE_ID="1"  # Optional, defaults to 1
```

1. Run the application:

```bash
pnpm dev
```

## Configuration

The app uses the following environment variables:

- `CHAIN_ID`: Chain ID (default: `xion-testnet-2`)
- `RPC_URL`: RPC endpoint URL
- `REST_URL`: REST API endpoint URL
- `GAS_PRICE`: Gas price (default: `0.001uxion`)
- `AA_API_URL`: Account Abstraction API URL
- `FEE_GRANTER_ADDRESS`: Fee granter address (required)
- `CHECKSUM`: Smart account contract checksum (required)
- `CODE_ID`: Smart account contract code ID (optional)
- `TREASURY_ADDRESS`: Treasury contract address (optional)

## Architecture

```
┌─────────────────────────────────────┐
│         Your Backend App            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    AbstraxionService          │ │
│  │  - Manages SignerController   │ │
│  │  - Provides simple API        │ │
│  └───────────────────────────────┘ │
│              │                      │
│              ▼                      │
│  ┌───────────────────────────────┐ │
│  │    WalletService              │ │
│  │  - Creates viem wallets       │ │
│  │  - Manages private keys       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  MemoryStorageStrategy        │ │
│  │  - Stores session data        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Usage Example

```typescript
import { WalletService } from "./services/WalletService";
import { AbstraxionService } from "./services/AbstraxionService";
import { MemoryStorageStrategy } from "./storage/MemoryStorageStrategy";
import { NoOpRedirectStrategy } from "./strategies/NoOpRedirectStrategy";

// 1. Create wallet
const walletService = new WalletService();
const walletAddress = await walletService.createWallet("user-123");

// 2. Create services
const storageStrategy = new MemoryStorageStrategy();
const redirectStrategy = new NoOpRedirectStrategy();

const abstraxionService = new AbstraxionService(
  {
    chainId: "xion-testnet-2",
    aaApiUrl: "https://aa-api.xion-testnet-2.burnt.com",
    smartAccountContract: {
      codeId: 1,
      checksum: "your-checksum",
      addressPrefix: "xion",
    },
    getSignerConfig: () => walletService.getSignerConfig("user-123"),
    feeGranter: "xion1...",
  },
  storageStrategy,
  redirectStrategy,
);

// 3. Initialize and connect
await abstraxionService.initialize();
await abstraxionService.connect();

// 4. Use signing client
const client = abstraxionService.getSigningClient();
// Send transactions...
```

## Important Notes

### Memory Storage

- **Temporary**: All data is lost when the process restarts
- **Not for production**: Use database storage for production environments
- **Per-instance**: Each `MemoryStorageStrategy` instance has its own storage

### Wallet Security

- **In-memory only**: Private keys are stored in memory
- **Not persistent**: Wallets are lost on restart
- **Production**: Use encrypted storage or hardware security modules

### Grants Management

- **Automatic**: Grants are created automatically on first connection
- **Auto-renewal**: Grants are recreated if expired or invalid
- **No manual intervention**: The system handles all grant lifecycle

## Project Structure

```
src/
├── index.ts                    # Main entry point
├── storage/
│   └── MemoryStorageStrategy.ts # In-memory storage
├── strategies/
│   └── NoOpRedirectStrategy.ts  # No-op redirect (not used in signer mode)
├── services/
│   ├── WalletService.ts         # Wallet management
│   └── AbstraxionService.ts     # Abstraxion integration
└── config/
    └── defaultConfig.ts         # Default configuration
```

## Development

```bash
# Run in development mode (with watch)
pnpm dev

# Build
pnpm build

# Run built version
pnpm start
```
