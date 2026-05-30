/**
 * useSignMessage - Sign messages with wallet
 * 
 * Used for authentication and verification
 */

'use client';

import { useSignMessage } from 'wagmi';

export function useSignAuth() {
  const { signMessageAsync, isPending } = useSignMessage();

  const signAuthMessage = async (address: string) => {
    if (!signMessageAsync) {
      throw new Error('Message signing not available');
    }

    const message = `Sign this message to authenticate with Aether: ${address}`;
    const signature = await signMessageAsync({ message });

    return {
      message,
      signature,
      address,
    };
  };

  return {
    signAuthMessage,
    isPending,
  };
}
