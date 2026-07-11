"use strict";
// @aether/auth - Wallet authentication utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = verifySignature;
exports.createAuthChallenge = createAuthChallenge;
const viem_1 = require("viem");
async function verifySignature(message, signature) {
    try {
        const recoveredAddress = await (0, viem_1.recoverMessageAddress)({
            message,
            signature: signature,
        });
        return recoveredAddress;
    }
    catch {
        return null;
    }
}
function createAuthChallenge() {
    return `Sign this message to authenticate: ${Date.now()}`;
}
//# sourceMappingURL=index.js.map