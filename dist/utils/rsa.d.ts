import { KeyObject } from 'crypto';
/**
 * Generates an RSA public key from provided modulus and exponent.
 *
 * @param data - An array where the first element is the modulus (hex) and the second is the exponent (hex).
 * @returns The generated RSA public key as a KeyObject or null if an error occurs.
 */
export declare function generateRsaKey(data: string[]): KeyObject | null;
/**
 * Encrypts a message using the provided RSA public key.
 *
 * @param msg - The plaintext message to encrypt.
 * @param publicKey - The RSA public key used for encryption.
 * @returns The encrypted message as a hexadecimal string, or an empty string if an error occurs.
 */
export declare function encryptRsa(msg: string, publicKey: KeyObject): string;
