export interface SignedMessage {
    message: string;
    signature: string;
    address: string;
}
export declare function verifySignature(message: string, signature: string): Promise<string | null>;
export declare function createAuthChallenge(): string;
//# sourceMappingURL=index.d.ts.map