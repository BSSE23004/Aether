'use client';

import { useWallet } from '@/hooks/useWallet';
import { useUIStore } from '@/stores/useUIStore';

export default function SettingsPage() {
  const { address } = useWallet();
  const { theme, setTheme } = useUIStore();

  return (
    <div className="p-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>

        {/* Account */}
        <div className="max-w-md rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Wallet Address</label>
              <p className="mt-1 text-sm text-muted-foreground">{address}</p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="max-w-md rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <select
                value={theme}
                onChange={(e) =>
                  setTheme(e.target.value as 'light' | 'dark' | 'system')
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="max-w-md rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Notifications</h2>
          <div className="space-y-3">
            {[
              { label: 'Messages', desc: 'Get notified of new messages' },
              { label: 'Proposals', desc: 'Get notified of new proposals' },
              {
                label: 'Community Updates',
                desc: 'Get notified of community changes',
              },
            ].map((notif, i) => (
              <label key={i} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded"
                />
                <div>
                  <p className="text-sm font-medium">{notif.label}</p>
                  <p className="text-xs text-muted-foreground">{notif.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
