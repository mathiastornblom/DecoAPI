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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const ping_1 = __importDefault(require("ping"));
const deco_1 = __importDefault(require("./deco"));
const rsa_1 = require("./utils/rsa");
const aes_1 = require("./utils/aes");
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
// Define a constant for the username to be used for authentication
const userName = 'admin';
// Class to handle endpoint arguments and query parameters
class EndpointArgs {
    constructor(form) {
        this.form = form;
    }
    // Method to create URL search parameters
    queryParams() {
        const q = new URLSearchParams();
        q.append('form', this.form);
        return q;
    }
}
// Initialize a CookieJar instance for handling cookies in requests
const cookieJar = new tough_cookie_1.CookieJar();
(0, axios_cookiejar_support_1.wrapper)(axios_1.default);
// Main Client class to interact with the API
class DecoAPIWraper {
    // Constructor to initialize the client with the target host
    constructor(target) {
        this.rsa = null;
        this.hash = '';
        this.stok = '';
        this.sequence = 0;
        const baseUrl = `http://${target}/cgi-bin/luci/`;
        this.host = `${target}`;
        this.c = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 10000,
            withCredentials: true,
            jar: cookieJar,
        });
        console.debug(`Client initialized with base URL: ${baseUrl}`);
    }
    // Private method to ping the target host and check if it's reachable
    pingHost() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield ping_1.default.promise.probe(this.host);
                console.log('Ping succeeded.');
                return res.alive;
            }
            catch (error) {
                console.error('Ping failed:', error);
                return false;
            }
        });
    }
    // Private method to ensure the Deco instance is initialized
    ensureDecoInstance() {
        if (!this.decoInstance) {
            this.decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            console.debug('Deco instance initialized with AES, RSA, and HTTP client.');
        }
    }
    // Public method to authenticate the client with the given password
    authenticate(password) {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug('Starting authentication process...');
            const hostIsAlive = yield this.pingHost();
            if (!hostIsAlive) {
                throw new Error(`Host ${this.host} is not reachable.`);
            }
            // Generate AES key for encryption
            this.aes = (0, aes_1.generateAESKey)();
            console.debug(`AES Key generated: ${this.aes.key.toString('hex')}`);
            console.debug(`AES IV generated: ${this.aes.iv.toString('hex')}`);
            // Generate MD5 hash using the username and password
            this.hash = crypto_1.default
                .createHash('md5')
                .update(`${userName}${password}`)
                .digest('hex');
            console.debug(`MD5 Hash generated: ${this.hash}`);
            this.ensureDecoInstance();
            console.debug('Attempting to retrieve password key...');
            const passwordKey = yield this.decoInstance.getPasswordKey();
            if (!passwordKey) {
                throw new Error('Failed to retrieve password key.');
            }
            console.debug('Password key retrieved successfully:', passwordKey);
            // Encrypt the password using the retrieved password key
            console.debug('Encrypting password using password key...');
            const encryptedPassword = (0, rsa_1.encryptRsa)(password, passwordKey);
            console.debug(`Encrypted password: ${encryptedPassword}`);
            console.debug('Attempting to retrieve session key...');
            const { key: sessionKey, seq: sequence } = yield this.decoInstance.getSessionKey();
            if (!sessionKey) {
                throw new Error('Failed to retrieve session key.');
            }
            console.debug(`Session key retrieved successfully: ${printKey(sessionKey)}), Sequence: ${sequence.toString()}`);
            // Update RSA key and sequence
            this.rsa = sessionKey;
            this.sequence = sequence;
            // Additional Logging for Debugging
            console.debug('Checking RSA key after session key retrieval:', this.rsa);
            // Continue with the login process...
            const loginReq = {
                params: {
                    password: encryptedPassword,
                },
                operation: 'login',
            };
            const loginJSON = JSON.stringify(loginReq);
            console.debug(`Login request JSON: ${loginJSON}`);
            const args = new EndpointArgs('login');
            console.debug('Sending login request...');
            try {
                const result = yield this.decoInstance.doEncryptedPost(';stok=/login', args, Buffer.from(loginJSON), true, sessionKey, this.sequence);
                this.stok = result.result.stok;
                console.debug(`Login successful. STOK: ${this.stok}`);
            }
            catch (e) {
                console.debug(e);
            }
        });
    }
    // Public method to retrieve performance data
    performance() {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug('Requesting performance data...');
            const args = new EndpointArgs('performance');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            return (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/network`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
        });
    }
    // Public method to retrieve the list of devices
    deviceList() {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug('Requesting device list...');
            const args = new EndpointArgs('device_list');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            return (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/device`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
        });
    }
    // Public method to retrieve the list of clients
    clientList() {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug('Requesting client list...');
            const args = new EndpointArgs('client_list');
            const request = {
                operation: 'read',
                params: { device_mac: 'default' },
            };
            const jsonRequest = JSON.stringify(request);
            console.debug(`Client list request JSON: ${jsonRequest}`);
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/client`, args, Buffer.from(jsonRequest), false));
            console.debug('Processing client list response...');
            for (const client of result.result.client_list) {
                try {
                    const decodedName = Buffer.from(client.name, 'base64').toString('utf-8');
                    client.name = decodedName;
                    console.debug(`Decoded client name: ${client.name}`);
                }
                catch (e) {
                    console.error(`Failed to decode client name: ${client.name}`, e);
                }
            }
            return result;
        });
    }
    // Public method to reboot devices based on their MAC addresses
    reboot(...macAddrs) {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug(`Requesting reboot for MAC addresses: ${macAddrs.join(', ')}`);
            const macList = macAddrs.map((mac) => ({ mac: mac.toUpperCase() }));
            const request = {
                operation: 'reboot',
                params: {
                    mac_list: macList,
                },
            };
            const jsonRequest = JSON.stringify(request);
            console.debug(`Reboot request JSON: ${jsonRequest}`);
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const args = new EndpointArgs('system');
            return (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/device`, args, Buffer.from(jsonRequest), false));
        });
    }
    // Public method to send a custom request to a specific endpoint
    custom(path, params, body) {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug(`Sending custom request to path: ${path}`);
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            return yield decoInstance.doEncryptedPost(`;stok=${this.stok}${path}`, params, body, false);
        });
    }
}
exports.default = DecoAPIWraper;
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
//# sourceMappingURL=client.js.map