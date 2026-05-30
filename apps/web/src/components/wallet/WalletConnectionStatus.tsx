/**
 * WalletConnectionStatus - Comprehensive connection status display
 * 
 * Shows:
 * - Connection state (connected/disconnected/connecting)
 * - Active chain
 * - Wallet address
 * - Balance (if connected)
 * - Warnings/errors
 */

'use client';

import { useAccount, useBalance } from 'wagmi';
import { useNetwork } from '@/hooks/wallet';

export function WalletConnectionStatus() {
  const { address, isConnected, isConnecting } = useAccount();
  const { isCorrectChain, chainName } = useNetwork();
  const { data: balance } = useBalance({ address, enabled: isConnected });

  if (!isConnected && !isConnecting) {
    return (
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-sm text-slate-600">
          Wallet not connected
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Connection status */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-blue-900">
            {isConnecting ? 'Connecting...' : 'Connected'}
          </span>
        </div>
      </div>

      {/* Address display */}
      {address && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Address</p>
          <p className="font-mono text-sm break-all">{address}</p>
        </div>
      )}

      {/* Chain status */}
      <div
        className={`p-3 rounded-lg border ${
          isCorrectChain
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <p className="text-xs text-slate-600 mb-1">Network</p>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isCorrectChain ? 'text-green-900' : 'text-yellow-900'
          }`}>
            {chainName}
          </span>
          {!isCorrectChain && (
            <span className="text-xs text-yellow-700 font-semibold">⚠️ Wrong Network</span>
          )}
        </div>
      </div>

      {/* Balance display */}
      {balance && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Balance</p>
          <p className="text-sm font-medium">
            {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
          </p>
        </div>
      )}
    </div>
  );
}
