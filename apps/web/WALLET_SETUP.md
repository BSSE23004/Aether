# Wallet Connection Setup Guide

## Overview

Aether uses RainbowKit + wagmi for secure, multi-wallet support on Base Sepolia testnet. This guide covers setup, usage, and best practices.

---

## Prerequisites

✅ All dependencies already installed:

- `wagmi@2.5.0` - Web3 wallet interactions
- `viem@2.7.0` - Ethereum utilities
- `@rainbow-me/rainbowkit@2.0.0` - Wallet UI
- `@tanstack/react-query@5.28.0` - State management

---

## Environment Setup

### Step 1: Get WalletConnect Project ID (FREE)

1. Visit https://cloud.walletconnect.com
2. Sign up (free account)
3. Create new project in dashboard
4. Copy **Project ID**

### Step 2: Configure Environment Variables

```bash
# apps/web/.env.local
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
```

**Full environment example:**

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local and fill in:
# - NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID (get from cloud.walletconnect.com)
# - Keep other values as defaults
```

### Step 3: Supported Wallets

RainbowKit automatically detects and supports:

- MetaMask
- Coinbase Wallet
- WalletConnect (any WalletConnect-compatible wallet)
- Safe (multisig)
- Ledger
- Trezor
- And 20+ more wallets

Users can connect any of these without additional configuration.

---

## Usage Patterns

### Pattern 1: Basic Wallet Connection Button

```typescript
'use client';

import { WalletConnectButton } from '@/components/wallet';

export function Header() {
  return (
    <header className="flex justify-between items-center">
      <h1>Aether</h1>
      <WalletConnectButton />
    </header>
  );
}
```

### Pattern 2: Check Connection State

```typescript
'use client';

import { useAccount } from 'wagmi';

export function MyComponent() {
  const { address, isConnected, chainId } = useAccount();

  if (!isConnected) {
    return <p>Please connect your wallet</p>;
  }

  return (
    <div>
      <p>Connected: {address}</p>
      <p>Chain ID: {chainId}</p>
    </div>
  );
}
```

### Pattern 3: Validate Network

```typescript
'use client';

import { useNetwork } from '@/hooks/wallet';
import { WalletChainAlert } from '@/components/wallet';

export function ProtectedComponent() {
  const { isCorrectChain } = useNetwork();

  return (
    <>
      <WalletChainAlert />
      {isCorrectChain && <YourComponent />}
    </>
  );
}
```

### Pattern 4: Sign Authentication Message

```typescript
'use client';

import { useSignAuth } from '@/hooks/wallet';
import { useAccount } from 'wagmi';

export function LoginButton() {
  const { address } = useAccount();
  const { signAuthMessage, isPending } = useSignAuth();

  const handleLogin = async () => {
    const { signature, message } = await signAuthMessage(address!);
    // Send to backend for verification
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
    });
  };

  return (
    <button onClick={handleLogin} disabled={isPending || !address}>
      {isPending ? 'Signing...' : 'Sign In with Wallet'}
    </button>
  );
}
```

### Pattern 5: Protect Routes

```typescript
// app/(dashboard)/layout.tsx
'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute requireCorrectChain={true}>
      {children}
    </ProtectedRoute>
  );
}
```

### Pattern 6: Use WalletConnection Provider

```typescript
// app/layout.tsx
import { WalletConnectionProvider } from '@/components/providers';

export default function RootLayout({ children }) {
  return (
    <WalletConnectionProvider
      onConnect={(address) => console.log('Connected:', address)}
      onDisconnect={() => console.log('Disconnected')}
    >
      {children}
    </WalletConnectionProvider>
  );
}
```

### Pattern 7: Show Connection Status

```typescript
'use client';

import { WalletConnectionStatus } from '@/components/wallet';

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1>Account Settings</h1>
      <WalletConnectionStatus />
    </div>
  );
}
```

---

## Available Hooks

### `useAccount()` - wagmi hook

Get current wallet connection state.

```typescript
const { address, isConnected, chainId } = useAccount();
```

### `useNetwork()` - Custom hook

Validate if user is on correct chain.

```typescript
const { isCorrectChain, chainId, chainName } = useNetwork();
```

### `useConnectWallet()` - Custom hook

Smart connection with auto-reconnect.

```typescript
const { address, isConnected, isConnecting, connectors, connect } = useConnectWallet();
```

### `useSignAuth()` - Custom hook

Sign authentication messages.

```typescript
const { signAuthMessage, isPending } = useSignAuth();
const { signature, message, address } = await signAuthMessage(userAddress);
```

### `useWalletEnsName()` - Custom hook

Get ENS name for wallet.

```typescript
const { ensName, displayName } = useWalletEnsName();
```

---

## Components Reference

### `<WalletConnectButton />`

RainbowKit connect button with responsive design.

```typescript
<WalletConnectButton />
```

### `<ConnectWalletCard />`

Prominent wallet connection prompt card.

```typescript
<ConnectWalletCard />
```

### `<WalletStatus />`

Compact connection indicator showing chain + balance.

```typescript
<WalletStatus />
```

### `<WalletConnectionStatus />`

Detailed connection dashboard.

```typescript
<WalletConnectionStatus />
```

### `<WalletChainAlert />`

Alert when user is on wrong chain with switch button.

```typescript
<WalletChainAlert />
```

### `<ProtectedRoute />`

Wrapper for routes that require wallet connection.

```typescript
<ProtectedRoute requireCorrectChain={true}>
  {children}
</ProtectedRoute>
```

---

## Advanced Configuration

### Custom Chain Configuration

If you need to support additional chains:

```typescript
// src/lib/blockchain/chains.ts
import { mainnet, baseSepolia } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [baseSepolia]; // Add more chains here
```

### Auto-Reconnect Logic

Wagmi + RainbowKit automatically:

1. Stores last connected wallet in localStorage
2. Auto-connects on page refresh (if wallet available)
3. Handles browser extension updates

No additional configuration needed.

### Error Handling

```typescript
'use client';

import { useWalletConnection } from '@/components/providers';

export function ErrorDisplay() {
  const { error } = useWalletConnection();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return null;
}
```

---

## Testing Wallet Connection

### Local Testing

1. **Install MetaMask** (Browser extension)
2. **Switch to Sepolia testnet**:
   - Open MetaMask
   - Settings → Networks → Add Network
   - Network name: Base Sepolia
   - RPC: https://sepolia.base.org
   - Chain ID: 84532
   - Currency: ETH

3. **Get Sepolia ETH** (free faucets):
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://sepoliafaucet.com

4. **Connect in app**:
   - Click "Connect Wallet"
   - Select MetaMask
   - Approve connection

### Testing Network Switching

1. Connect wallet on wrong chain
2. See `<WalletChainAlert />` appear
3. Click "Switch to Base Sepolia"
4. Confirm in wallet prompt

---

## Troubleshooting

### Issue: "WalletConnect Project ID not configured"

**Solution**: Get free Project ID from https://cloud.walletconnect.com

### Issue: "Wrong Network" warning

**Solution**:

1. Open MetaMask
2. Switch network to Base Sepolia
3. Or use `<WalletChainAlert />` button

### Issue: Auto-reconnect not working

**Solution**:

1. Ensure wallet extension is installed
2. Check localStorage for `wagmi.wallet` key
3. Try incognito mode (privacy setting issue)

### Issue: Can't sign messages

**Solution**:

1. Ensure wallet is connected
2. Check browser console for errors
3. Some wallets require additional permissions

---

## Security Best Practices

✅ **DO**:

- Validate signatures on backend
- Use message nonce/timestamp
- Store tokens securely (httpOnly cookies preferred)
- Validate chain ID before transactions
- Use ENS names when available
- Clear cache on logout

❌ **DON'T**:

- Store private keys in frontend
- Log sensitive data
- Trust frontend-only validation
- Allow transactions without user confirmation
- Skip chain validation

---

## Next Steps

1. ✅ **Wallet connection**: Complete (you're here)
2. **Authentication**: Implement login with signature (see [AUTH_SETUP.md](../AUTH_SETUP.md))
3. **Contract Interaction**: Read/write contract functions (see [CONTRACTS.md](../../contracts/CONTRACTS.md))
4. **Token Transfers**: Send tokens/NFTs (wagmi guide)

---

## Additional Resources

- [wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)
- [viem Documentation](https://viem.sh)
- [Base Sepolia Documentation](https://docs.base.org)
- [WalletConnect Documentation](https://docs.walletconnect.com)

---

## Support

For issues or questions:

1. Check browser console for errors
2. Review [wagmi troubleshooting](https://wagmi.sh/react/guides/error-handling)
3. Open issue on GitHub with:
   - Error message
   - Browser/wallet version
   - Reproduction steps
