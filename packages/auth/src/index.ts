// @aether/auth - Wallet authentication utilities

import { recoverMessageAddress } from 'viem';

export interface SignedMessage {
  message: string;
  signature: string;
  address: string;
}

export async function verifySignature(
  message: string,
  signature: string,
): Promise<string | null> {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    return recoveredAddress;
  } catch {
    return null;
  }
}

export function createAuthChallenge(): string {
  return `Sign this message to authenticate: ${Date.now()}`;
}
