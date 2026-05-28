'use client';

import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/utils';

export default function DashboardPage() {
  const { address } = useWallet();

  return (
    <div className="p-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {formatAddress(address || '')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Communities', value: '0', icon: '🏘️' },
            { label: 'Messages', value: '0', icon: '💬' },
            { label: 'Proposals', value: '0', icon: '🏛️' },
            { label: 'Tokens Held', value: '0', icon: '🎫' },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <button className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-accent">
              Create Community
            </button>
            <button className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-accent">
              Browse Communities
            </button>
            <button className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-accent">
              View Proposals
            </button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
          <p className="text-muted-foreground">No recent activity yet</p>
        </div>
      </div>
    </div>
  );
}
