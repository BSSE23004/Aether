'use client';

import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isConnected } = useWallet();

  useEffect(() => {
    if (!isConnected) {
      router.push('/auth/connect');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <TopNav />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
