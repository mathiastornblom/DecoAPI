export interface AESKey {
    key: Buffer;
    iv: Buffer;
}
export declare function generateAESKey(): AESKey;
export declare function AES128Encrypt(plaintext: string, key: AESKey): string;
export declare function AES128Decrypt(encrypted: string, key: AESKey): string;
