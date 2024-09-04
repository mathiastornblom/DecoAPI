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
const deco_1 = __importDefault(require("./deco"));
const rsa_1 = require("./utils/rsa");
const aes_1 = require("./utils/aes");
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
const debug_1 = require("debug");
const err = (0, debug_1.debug)('decoapiwrapper:error');
const log = (0, debug_1.debug)('decoapiwrapper:log');
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
    }
    // Method to ping the host
    pingHost(host) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.c.get(`http://${host}`);
                return response.status === 200;
            }
            catch (error) {
                return false;
            }
        });
    }
    // Private method to ensure the Deco instance is initialized
    ensureDecoInstance() {
        if (!this.decoInstance) {
            this.decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            log('client.ts: ' +
                'Deco instance initialized with AES, RSA, and HTTP client.');
        }
    }
    // Public method to authenticate the client with the given password
    authenticate(password) {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Starting authentication process...');
            let authenticated = false;
            const hostIsAlive = yield this.pingHost(this.host);
            try {
                if (!hostIsAlive) {
                    throw new Error(`client.ts: Host ${this.host} is not reachable.`);
                }
                // Generate AES key for encryption
                this.aes = (0, aes_1.generateAESKey)();
                log('client.ts: ' + `AES Key generated: ${this.aes.key.toString('hex')}`);
                log('client.ts: ' + `AES IV generated: ${this.aes.iv.toString('hex')}`);
                // Generate MD5 hash using the username and password
                this.hash = crypto_1.default
                    .createHash('md5')
                    .update(`${userName}${password}`)
                    .digest('hex');
                log('client.ts: ' + `MD5 Hash generated: ${this.hash}`);
                this.ensureDecoInstance();
                log('client.ts: ' + 'Attempting to retrieve password key...');
                const passwordKey = yield this.decoInstance.getPasswordKey();
                if (!passwordKey) {
                    throw new Error('client.ts: ' + 'Failed to retrieve password key.');
                }
                log('client.ts: ' + 'Password key retrieved successfully:', passwordKey);
                // Encrypt the password using the retrieved password key
                log('client.ts: ' + 'Encrypting password using password key...');
                const encryptedPassword = (0, rsa_1.encryptRsa)(password, passwordKey);
                log('client.ts: ' + `Encrypted password: ${encryptedPassword}`);
                log('client.ts: ' + 'Attempting to retrieve session key...');
                const { key: sessionKey, seq: sequence } = yield this.decoInstance.getSessionKey();
                if (!sessionKey) {
                    throw new Error('client.ts: ' + 'Failed to retrieve session key.');
                }
                log('client.ts: ' +
                    `Session key retrieved successfully: ${printKey(sessionKey)}), Sequence: ${sequence.toString()}`);
                // Update RSA key and sequence
                this.rsa = sessionKey;
                this.sequence = sequence;
                // Additional Logging for Debugging
                log('client.ts: ' + 'Checking RSA key after session key retrieval:', this.rsa);
                // Continue with the login process...
                const loginReq = {
                    params: {
                        password: encryptedPassword + '&confirm=true',
                    },
                    operation: 'login',
                };
                const loginJSON = JSON.stringify(loginReq);
                log('client.ts: ' + `Login request JSON: ${loginJSON}`);
                const args = new EndpointArgs('login');
                log('client.ts: ' + 'Sending login request...');
                try {
                    const result = yield this.decoInstance.doEncryptedPost(';stok=/login', args, Buffer.from(loginJSON), true, sessionKey, this.sequence);
                    this.stok = result.result.stok;
                    if (!this.stok) {
                        throw new Error('client.ts: ' + 'Failed to retrieve STok.');
                    }
                    else {
                        log('client.ts: ' + `Login successful. STOK: ${this.stok}`);
                        authenticated = true;
                    }
                }
                catch (e) {
                    log('client.ts: ' + e);
                    return authenticated;
                }
                return authenticated;
            }
            catch (_a) {
                return authenticated;
            }
        });
    }
    // Public method to retrieve Wan data
    getAdvancedSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting advanced data...');
            const args = new EndpointArgs('power');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const response = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/wireless`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (response &&
                typeof response === 'object' &&
                'errorcode' in response &&
                'success' in response) {
                const errorResponse = {
                    errorcode: response.errorcode,
                    success: response.success,
                };
                err('client.ts: ' + 'Advanced request failed:', errorResponse);
                return errorResponse;
            }
            return response;
        });
    }
    // Public method to retrieve Wan data
    getWLAN() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting status data...');
            const args = new EndpointArgs('wlan');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const response = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/wireless`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (response &&
                typeof response === 'object' &&
                'errorcode' in response &&
                'success' in response) {
                const errorResponse = {
                    errorcode: response.errorcode,
                    success: response.success,
                };
                err('client.ts: ' + 'WLAN request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            const decodeBase64 = (encoded) => {
                try {
                    return Buffer.from(encoded, 'base64').toString('utf-8');
                }
                catch (e) {
                    err('client.ts: ' + `Failed to decode base64 string: ${encoded}`, e);
                    return encoded; // Returnera den ursprungliga strängen om dekodning misslyckas
                }
            };
            // Dekodera band5_1
            response.result.band5_1.guest.ssid = decodeBase64(response.result.band5_1.guest.ssid);
            response.result.band5_1.guest.password = decodeBase64(response.result.band5_1.guest.password);
            response.result.band5_1.host.ssid = decodeBase64(response.result.band5_1.host.ssid);
            response.result.band5_1.host.password = decodeBase64(response.result.band5_1.host.password);
            // Dekodera band2_4
            response.result.band2_4.guest.ssid = decodeBase64(response.result.band2_4.guest.ssid);
            response.result.band2_4.guest.password = decodeBase64(response.result.band2_4.guest.password);
            response.result.band2_4.host.ssid = decodeBase64(response.result.band2_4.host.ssid);
            response.result.band2_4.host.password = decodeBase64(response.result.band2_4.host.password);
            log('client.ts: ' + 'Processed WLAN network response: ', JSON.stringify(response));
            return response;
        });
    }
    // Public method to retrieve LAN data
    getLAN() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting status data...');
            const args = new EndpointArgs('lan_ip');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/network`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (result &&
                typeof result === 'object' &&
                'errorcode' in result &&
                'success' in result) {
                const errorResponse = {
                    errorcode: result.errorcode,
                    success: result.success,
                };
                err('client.ts: ' + 'LAN request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve Wan data
    getWAN() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting status data...');
            const args = new EndpointArgs('wan_ipv4');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/network`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (result &&
                typeof result === 'object' &&
                'errorcode' in result &&
                'success' in result) {
                const errorResponse = {
                    errorcode: result.errorcode,
                    success: result.success,
                };
                err('client.ts: ' + 'WAN request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve Internt data
    getInternet() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting status data...');
            const args = new EndpointArgs('internet');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/network`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (result &&
                typeof result === 'object' &&
                'errorcode' in result &&
                'success' in result) {
                const errorResponse = {
                    errorcode: result.errorcode,
                    success: result.success,
                };
                err('client.ts: ' + 'Internet request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve enviromet data
    getModel() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting status data...');
            const args = new EndpointArgs('model');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/device`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (result &&
                typeof result === 'object' &&
                'errorcode' in result &&
                'success' in result) {
                const errorResponse = {
                    errorcode: result.errorcode,
                    success: result.success,
                };
                err('client.ts: ' + 'Model request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve enviromet data
    getEnviroment() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting status data...');
            const args = new EndpointArgs('envar');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/system`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (result &&
                typeof result === 'object' &&
                'errorcode' in result &&
                'success' in result) {
                const errorResponse = {
                    errorcode: result.errorcode,
                    success: result.success,
                };
                err('client.ts: ' + 'Enviromet request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve status data
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting status data...');
            const args = new EndpointArgs('all');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/status`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (result &&
                typeof result === 'object' &&
                'errorcode' in result &&
                'success' in result) {
                const errorResponse = {
                    errorcode: result.errorcode,
                    success: result.success,
                };
                err('client.ts: ' + 'Status request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve firmware data
    firmware() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting firmware data...');
            const args = new EndpointArgs('upgrade');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/firmware`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Chech if error
            if (result &&
                typeof result === 'object' &&
                'errorcode' in result &&
                'success' in result) {
                const errorResponse = {
                    errorcode: result.errorcode,
                    success: result.success,
                };
                err('client.ts: ' + 'Firmware request failed:', errorResponse);
                return errorResponse;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve performance data
    performance() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting performance data...');
            const args = new EndpointArgs('performance');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/network`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Check if result is an error
            if (isErrorResponse(result)) {
                err('client.ts: ' + 'Performance request failed:', result);
                return result;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve the list of devices
    deviceList() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting device list...');
            const args = new EndpointArgs('device_list');
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/device`, args, Buffer.from(JSON.stringify({ operation: 'read' })), false));
            // Check if result is an error
            if (isErrorResponse(result)) {
                err('client.ts: ' + 'device list request failed:', result);
                return result;
            }
            // If no error do respond with result
            return result;
        });
    }
    // Public method to retrieve the list of clients
    clientList() {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + 'Requesting client list...');
            const args = new EndpointArgs('client_list');
            const request = {
                operation: 'read',
                params: { device_mac: 'default' },
            };
            const jsonRequest = JSON.stringify(request);
            log('client.ts: ' + `Client list request JSON: ${jsonRequest}`);
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/client`, args, Buffer.from(jsonRequest), false));
            // Check if result is an error
            if (isErrorResponse(result)) {
                err('client.ts: ' + 'client list request failed:', result);
                return result;
            }
            log('client.ts: ' + 'Processing client list response...');
            // Uppdatera client_list med dekodade namn
            result.result.client_list.forEach((client) => {
                try {
                    // Försök att dekoda namnet
                    const decodedName = Buffer.from(client.name, 'base64').toString('utf-8');
                    log('client.ts: ' + `Decoded client name: ${decodedName}`);
                    // Sätt det dekodade namnet till klienten
                    client.name = decodedName;
                }
                catch (e) {
                    // Logga fel om dekodningen misslyckas
                    err('client.ts: ' + `Failed to decode client name: ${client.name}`, e);
                }
            });
            log('client.ts: ' + 'Processed client list response: ', JSON.stringify(result));
            // Returnera det uppdaterade resultatet
            return result;
        });
    }
    // Public method to reboot devices based on their MAC addresses
    reboot(...macAddrs) {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' +
                `Requesting reboot for MAC addresses: ${macAddrs.join(', ')}`);
            const macList = macAddrs.map((mac) => ({ mac: mac.toUpperCase() }));
            const request = {
                operation: 'reboot',
                params: {
                    mac_list: macList,
                },
            };
            const jsonRequest = JSON.stringify(request);
            log('client.ts: ' + `Reboot request JSON: ${jsonRequest}`);
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const args = new EndpointArgs('system');
            return (yield decoInstance.doEncryptedPost(`;stok=${this.stok}/admin/device`, args, Buffer.from(jsonRequest), false));
        });
    }
    // Public method to send a custom request to a specific endpoint
    custom(path, params, body) {
        return __awaiter(this, void 0, void 0, function* () {
            log('client.ts: ' + `Sending custom request to path: ${path}`);
            const decoInstance = new deco_1.default(this.aes, this.hash, this.rsa, this.sequence, this.c);
            const result = (yield decoInstance.doEncryptedPost(`;stok=${this.stok}${path}`, params, body, false));
            // Check if result is an error
            if (isErrorResponse(result)) {
                err('client.ts: ' + 'client list request failed:', result);
                return result;
            }
            return result;
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
// Type guard för att kontrollera om ett objekt är av typen ErrorResponse
function isErrorResponse(result) {
    return (typeof result === 'object' &&
        result !== null &&
        'errorcode' in result &&
        'success' in result &&
        typeof result.errorcode === 'string' &&
        typeof result.success === 'boolean');
}
//# sourceMappingURL=client.js.map