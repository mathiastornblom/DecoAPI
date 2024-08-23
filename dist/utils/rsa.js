"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRsaKey = generateRsaKey;
exports.encryptRsa = encryptRsa;
const crypto_1 = __importStar(require("crypto"));
const asn1 = __importStar(require("asn1.js"));
const bn_js_1 = __importDefault(require("bn.js"));
// Define the ASN.1 structure for an RSA public key
const RSAPublicKeyASN = asn1.define('RSAPublicKey', function () {
    this.seq().obj(this.key('n').int(), this.key('e').int());
});
/**
 * Generates an RSA public key from provided modulus and exponent.
 *
 * @param data - An array where the first element is the modulus (hex) and the second is the exponent (hex).
 * @returns The generated RSA public key as a KeyObject or null if an error occurs.
 */
function generateRsaKey(data) {
    console.log('generateRsaKey: Starting RSA key generation.');
    console.log(`generateRsaKey: Modulus (hex): ${data[0]}`);
    console.log(`generateRsaKey: Exponent (hex): ${data[1]}`);
    // Convert the modulus and exponent from hex strings to BN (Big Number) objects
    const modulus = new bn_js_1.default(data[0], 16);
    const exponent = parseInt(data[1], 16);
    if (isNaN(exponent)) {
        console.error('generateRsaKey: Error parsing exponent.');
        return null;
    }
    // Encode the modulus and exponent into ASN.1 DER format
    const publicKeyDER = RSAPublicKeyASN.encode({
        n: modulus,
        e: new bn_js_1.default(exponent),
    }, 'der');
    // Create the RSA public key from the DER-encoded buffer
    const key = (0, crypto_1.createPublicKey)({
        key: publicKeyDER,
        format: 'der',
        type: 'pkcs1',
    });
    console.log(`generateRsaKey: Generated RSA Public Key (DER, hex):\n${key
        .export({ format: 'der', type: 'pkcs1' })
        .toString('hex')}`);
    return key;
}
/**
 * Encrypts a message using the provided RSA public key.
 *
 * @param msg - The plaintext message to encrypt.
 * @param publicKey - The RSA public key used for encryption.
 * @returns The encrypted message as a hexadecimal string, or an empty string if an error occurs.
 */
function encryptRsa(msg, publicKey) {
    var _a;
    console.log('encryptRsa: Starting RSA encryption.');
    console.log(`encryptRsa: Message to encrypt: ${msg}`);
    console.log(`encryptRsa: Key: ${publicKey
        .export({ format: 'der', type: 'pkcs1' })
        .toString('hex')}`);
    try {
        // Convert the message to a Buffer
        const messageBuffer = Buffer.from(msg, 'utf-8');
        // Determine the RSA key size in bits
        const keySize = (_a = publicKey.asymmetricKeyDetails) === null || _a === void 0 ? void 0 : _a.modulusLength;
        if (!keySize) {
            throw new Error('Failed to determine RSA key size.');
        }
        // Encrypt the message using the RSA public key
        const cipher = crypto_1.default.publicEncrypt({
            key: publicKey,
            padding: crypto_1.default.constants.RSA_PKCS1_PADDING,
        }, messageBuffer);
        // Convert the encrypted message to a hexadecimal string
        const encryptedMsg = cipher.toString('hex');
        console.log(`encryptRsa: Encrypted message (hex): ${encryptedMsg}`);
        return encryptedMsg;
    }
    catch (err) {
        console.error(`encryptRsa: Error encrypting message: ${err}`);
        return '';
    }
}
//# sourceMappingURL=rsa.js.map