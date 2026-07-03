export function canonicalize(val: any): string;
export function base64ToBytes(base64: string): Uint8Array;
export function verifyRawEd25519(message: string, signatureB64: string, publicKey: string): Promise<boolean>;
export function verifyEd25519Signature(data: any, signatureB64: string, publicKey: string): Promise<boolean>;

export interface ValidationResult {
    isValid: boolean;
    status: "verified" | "trusted" | "expired" | "revoked" | "unverified";
    message: string;
    attestation: any;
}

export function fetchAndVerifyRegistryAttestation(agentId: string, registryUrl: string): Promise<ValidationResult>;
