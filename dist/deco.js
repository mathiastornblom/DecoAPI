"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rsa_1 = require("./utils/rsa");
const aes_1 = require("./utils/aes");
const inspector_1 = require("inspector");
// Buffer for the default body used in read operations
const readBody = Buffer.from(JSON.stringify({ operation: 'read' }));
// Deco class handles encryption, decryption, and communication with the server
class Deco {
    // Constructor initializes the Deco instance with necessary encryption keys and HTTP client
    constructor(aes, hash, rsa, sequence, httpClient) {
        this.aes = aes;
        this.hash = hash;
        this.rsa = rsa;
        this.sequence = sequence;
        this.c = httpClient;
        console.debug('Deco instance initialized with AES, RSA, and HTTP client.');
    }
    // Static method to generate a new AES key
    static generateAESKey() {
        console.debug('Generating AES key...');
        return (0, aes_1.generateAESKey)();
    }
    // Method to retrieve the password key from the server and generate an RSA key from it
    getPasswordKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const args = { form: 'keys' };
            console.debug('getPasswordKey: Starting password key retrieval.');
            try {
                const passKey = yield this.doPost(';stok=/login', args, readBody);
                console.debug('getPasswordKey: Received password key response:', passKey);
                if (passKey.error_code !== 0) {
                    throw new Error(`Error fetching password key: ${passKey.error_code}`);
                }
                const key = (0, rsa_1.generateRsaKey)(passKey.result.password);
                console.log('getPasswordKey: Generated RSA public key:', key);
                return key;
            }
            catch (err) {
                console.error('getPasswordKey: Error generating RSA key:', err);
                return null;
            }
        });
    }
    // Method to retrieve the session key from the server and generate an RSA key from it
    getSessionKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const args = { form: 'auth' };
            console.debug('getSessionKey: Starting session key retrieval.');
            try {
                const passKey = yield this.doPost(';stok=/login', args, readBody);
                console.debug('getSessionKey: Received session key response: ', passKey);
                if (passKey.error_code !== 0) {
                    throw new Error(`Error fetching session key: ${passKey.error_code}`);
                }
                const key = (0, rsa_1.generateRsaKey)(passKey.result.key);
                console.log('getSessionKey: Error generating RSA key:', key);
                return { key, seq: passKey.result.seq };
            }
            catch (err) {
                console.error('getSessionKey: Failed to get session key:', err);
                return { key: null, seq: 0 };
            }
        });
    }
    // Method to send an encrypted POST request to the server
    doEncryptedPost(path_1, params_1, body_1, isLogin_1) {
        return __awaiter(this, arguments, void 0, function* (path, params, body, isLogin, key = this.rsa, sequence = this.sequence) {
            console.debug('Starting encrypted POST request...');
            // Check and log the RSA key
            console.debug('Checking RSA key before encryption:', key);
            if (!key) {
                console.error('RSA key is missing or undefined before encryption.');
                throw new Error('RSA key is missing or undefined.');
            }
            try {
                // Encrypt the data using AES
                const encryptedData = (0, aes_1.AES128Encrypt)(body.toString(), this.aes);
                console.debug('Data encrypted with AES:', encryptedData);
                const length = Number(sequence) + encryptedData.length;
                let sign;
                // Generate sign data depending on whether it's a login request or not
                if (isLogin) {
                    sign = `k=${this.aes.key}&i=${this.aes.iv}&h=${this.hash}&s=${length}`;
                    console.debug('doEncryptedPost: Generated login sign data:', sign);
                }
                else {
                    sign = `h=${this.hash}&s=${length}`;
                    console.debug('doEncryptedPost: Generated non-login sign data:', sign);
                }
                // Encrypt the sign data with RSA, possibly splitting it into two parts
                if (sign.length > 53) {
                    const first = (0, rsa_1.encryptRsa)(sign.substring(0, 53), key);
                    const second = (0, rsa_1.encryptRsa)(sign.substring(53), key);
                    sign = `${first}${second}`;
                    console.debug('Sign split into two encrypted parts.');
                }
                else {
                    sign = (0, rsa_1.encryptRsa)(sign, key);
                    console.debug('Sign encrypted as a single block.');
                }
                // Prepare the final POST data
                const postData = `sign=${encodeURIComponent(sign)}&data=${encodeURIComponent(encryptedData)}`;
                console.debug('doEncryptedPost: Final POST data:', postData);
                // Convert postData to a Buffer and send it in the request
                const postDataBuffer = Buffer.from(postData);
                // Send the POST request with encrypted data
                const req = yield this.doPost(path, params, postDataBuffer);
                console.debug('Encrypted POST request successful:', req);
                // Decrypt the response data
                const decoded = (0, aes_1.AES128Decrypt)(req.data, this.aes);
                console.debug('doEncryptedPost: Decrypted response:', decoded);
                return JSON.parse(decoded);
            }
            catch (err) {
                console.error('Error in doEncryptedPost:', err);
                throw err;
            }
        });
    }
    // Method to send a POST request to the server
    doPost(path, params, body) {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug(`Sending POST request to ${path} with params: ${params} and body params ${body}`);
            // Configure the POST request
            const config = {
                method: 'POST',
                url: path,
                data: body,
                headers: {
                    'Accept-Encoding': 'gzip',
                    'Content-Type': 'application/json',
                },
                params: params, // Sending as a regular object
            };
            // Remove the 'Accept' header before sending the request
            this.c.interceptors.request.use((config) => {
                delete config.headers['Accept'];
                return config;
            });
            // Debugging raw body data before sending the request
            console.debug('URL:', inspector_1.url);
            console.debug('Query params:', params);
            console.debug('POST body:', body.toString());
            console.debug('Headers:', config);
            try {
                // Send the request and return the response data
                const response = yield this.c(config);
                console.debug('doPost: Response status:', response.status);
                console.debug('doPost: Decoded response:', response.data);
                return response.data;
            }
            catch (err) {
                console.error('Error in doPost:', err);
                throw err;
            }
        });
    }
}
exports.default = Deco;
// Function to extract and print details from an RSA KeyObject
function printKey(keyObject) {
    var _a;
    // Export the key as a DER-encoded buffer
    const keyBuffer = keyObject.export({ type: 'pkcs1', format: 'der' });
    // The modulus for RSA keys is stored in the first part of the key structure
    // Parse the modulus by skipping the header bytes in the DER-encoded key
    const modulusOffset = 29; // Skip the header bytes (this offset can vary slightly)
    const modulusLength = keyBuffer.readUInt16BE(modulusOffset - 2); // Read the modulus length
    // Extract the modulus
    const modulus = keyBuffer.slice(modulusOffset, modulusOffset + modulusLength);
    return ('Modulus (hex): ' +
        modulus.toString('hex') +
        'Exponent: ' +
        ((_a = keyObject.asymmetricKeyDetails) === null || _a === void 0 ? void 0 : _a.publicExponent));
}
//# sourceMappingURL=deco.js.map