// @aether/auth - Wallet authentication utilities
import { recoverMessageAddress } from 'viem';
export async function verifySignature(message, signature) {
    try {
        const recoveredAddress = await recoverMessageAddress({
            message,
            signature: signature,
        });
        return recoveredAddress;
    }
    catch {
        return null;
    }
}
export function createAuthChallenge() {
    return `Sign this message to authenticate: ${Date.now()}`;
}
//# sourceMappingURL=index.js.map