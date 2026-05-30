/**
 * WalletConnectButton - RainbowKit integration with custom styling
 * 
 * Wraps RainbowKit's ConnectButton with Aether branding
 */

'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletConnectButton() {
  return (
    <ConnectButton
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
      showBalance={{
        smallScreen: false,
        largeScreen: true,
      }}
      chainStatus={{
        smallScreen: 'icon',
        largeScreen: 'full',
      }}
    />
  );
}
