'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function TopNav() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/50 backdrop-blur-md z-50">
      <div className="flex h-full items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">🌌</span>
          <span className="hidden sm:inline">Aether</span>
        </Link>

        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
