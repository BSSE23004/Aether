'use client';

import { WalletConnectionProvider } from '@/components/providers';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletConnectionProvider>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-8 p-4">
          {children}
        </div>
      </div>
    </WalletConnectionProvider>
  );
}
