'use client';

import { TopNav } from '@/components/layout/TopNav';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { WalletChainAlert } from '@/components/wallet';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireCorrectChain={true}>
      <TopNav />
      <WalletChainAlert />
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
