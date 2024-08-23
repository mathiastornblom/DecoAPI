import crypto, { KeyObject } from 'crypto';
import axios, { AxiosInstance } from 'axios';
import ping from 'ping';
import Deco from './deco';
import { encryptRsa } from './utils/rsa';
import { AESKey, generateAESKey } from './utils/aes';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// Define a constant for the username to be used for authentication
const userName = 'admin';

// Interface to define the structure of the response for client list
interface ClientListResponse {
  error_code: number;
  result: {
    client_list: Array<{
      access_host: string;
      client_mesh: boolean;
      client_type: string;
      connection_type: string;
      down_speed: number;
      enable_priority: boolean;
      interface: string;
      ip: string;
      mac: string;
      name: string;
      online: boolean;
      owner_id: string;
      remain_time: number;
      space_id: string;
      up_speed: number;
      wire_type: string;
    }>;
  };
}

// Interface to define the structure of the response for device list
interface DeviceListResponse {
  error_code: number;
  result: {
    device_list: Array<{
      device_ip: string;
      device_id?: string;
      device_type: string;
      nand_flash: boolean;
      owner_transfer?: boolean;
      previous: string;
      bssid_5g: string;
      bssid_2g: string;
      bssid_sta_5g: string;
      bssid_sta_2g: string;
      parent_device_id?: string;
      software_ver: string;
      role: string;
      product_level: number;
      hardware_ver: string;
      inet_status: string;
      support_plc: boolean;
      mac: string;
      set_gateway_support: boolean;
      inet_error_msg: string;
      connection_type?: string[];
      custom_nickname?: string;
      nickname: string;
      group_status: string;
      oem_id: string;
      signal_level: {
        band2_4: string;
        band5: string;
      };
      device_model: string;
      oversized_firmware: boolean;
      speed_get_support?: boolean;
      hw_id: string;
    }>;
  };
}

// Interface to define the structure of the response for performance data
interface PerformanceResponse {
  error_code: number;
  result: {
    cpu_usage: number;
    mem_usage: number;
  };
}

// Interface for the structure of login request
interface LoginRequest {
  params: {
    password: string;
  };
  operation: string;
}

// Interface for generic request parameters
interface RequestParams {
  operation?: string;
  params?: { [key: string]: any };
}

// Class to handle endpoint arguments and query parameters
class EndpointArgs {
  form: string;

  constructor(form: string) {
    this.form = form;
  }

  // Method to create URL search parameters
  queryParams(): URLSearchParams {
    const q = new URLSearchParams();
    q.append('form', this.form);
    return q;
  }
}

// Initialize a CookieJar instance for handling cookies in requests
const cookieJar = new CookieJar();
wrapper(axios);

// Main Client class to interact with the API
export default class DecoAPIWraper {
  public c: AxiosInstance;
  public aes: AESKey | undefined;
  public rsa: KeyObject | null = null;
  public hash: string = '';
  public stok: string = '';
  public sequence: number = 0;
  public host: string;
  public decoInstance: Deco | undefined;

  // Constructor to initialize the client with the target host
  constructor(target: string) {
    const baseUrl = `http://${target}/cgi-bin/luci/`;
    this.host = `${target}`;
    this.c = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      withCredentials: true,
      jar: cookieJar,
    }) as AxiosInstance;
    console.debug(`Client initialized with base URL: ${baseUrl}`);
  }

  // Private method to ping the target host and check if it's reachable
  private async pingHost(): Promise<boolean> {
    try {
      const res = await ping.promise.probe(this.host);
      console.log('Ping succeeded.');
      return res.alive;
    } catch (error) {
      console.error('Ping failed:', error);
      return false;
    }
  }

  // Private method to ensure the Deco instance is initialized
  private ensureDecoInstance() {
    if (!this.decoInstance) {
      this.decoInstance = new Deco(
        this.aes!,
        this.hash,
        this.rsa!,
        this.sequence,
        this.c,
      );
      console.debug(
        'Deco instance initialized with AES, RSA, and HTTP client.',
      );
    }
  }

  // Public method to authenticate the client with the given password
  public async authenticate(password: string): Promise<void> {
    console.debug('Starting authentication process...');
    const hostIsAlive = await this.pingHost();

    if (!hostIsAlive) {
      throw new Error(`Host ${this.host} is not reachable.`);
    }

    // Generate AES key for encryption
    this.aes = generateAESKey();
    console.debug(`AES Key generated: ${this.aes.key.toString('hex')}`);
    console.debug(`AES IV generated: ${this.aes.iv.toString('hex')}`);

    // Generate MD5 hash using the username and password
    this.hash = crypto
      .createHash('md5')
      .update(`${userName}${password}`)
      .digest('hex');
    console.debug(`MD5 Hash generated: ${this.hash}`);

    this.ensureDecoInstance();

    console.debug('Attempting to retrieve password key...');
    const passwordKey = await this.decoInstance!.getPasswordKey();
    if (!passwordKey) {
      throw new Error('Failed to retrieve password key.');
    }
    console.debug('Password key retrieved successfully:', passwordKey);

    // Encrypt the password using the retrieved password key
    console.debug('Encrypting password using password key...');
    const encryptedPassword = encryptRsa(password, passwordKey!);
    console.debug(`Encrypted password: ${encryptedPassword}`);

    console.debug('Attempting to retrieve session key...');
    const { key: sessionKey, seq: sequence } =
      await this.decoInstance!.getSessionKey();
    if (!sessionKey) {
      throw new Error('Failed to retrieve session key.');
    }
    console.debug(
      `Session key retrieved successfully: ${printKey(
        sessionKey,
      )}), Sequence: ${sequence.toString()}`,
    );

    // Update RSA key and sequence
    this.rsa = sessionKey;
    this.sequence = sequence;

    // Additional Logging for Debugging
    console.debug('Checking RSA key after session key retrieval:', this.rsa);

    // Continue with the login process...
    const loginReq: LoginRequest = {
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
      const result = await this.decoInstance!.doEncryptedPost(
        ';stok=/login',
        args,
        Buffer.from(loginJSON),
        true,
        sessionKey,
        this.sequence,
      );

      this.stok = result.result.stok;
      console.debug(`Login successful. STOK: ${this.stok}`);
    } catch (e) {
      console.debug(e);
    }
  }

  // Public method to retrieve performance data
  async performance(): Promise<PerformanceResponse> {
    console.debug('Requesting performance data...');
    const args = new EndpointArgs('performance');
    const decoInstance = new Deco(
      this.aes!,
      this.hash,
      this.rsa!,
      this.sequence,
      this.c,
    );
    return (await decoInstance.doEncryptedPost(
      `;stok=${this.stok}/admin/network`,
      args,
      Buffer.from(JSON.stringify({ operation: 'read' })),
      false,
    )) as PerformanceResponse;
  }

  // Public method to retrieve the list of devices
  async deviceList(): Promise<DeviceListResponse> {
    console.debug('Requesting device list...');
    const args = new EndpointArgs('device_list');
    const decoInstance = new Deco(
      this.aes!,
      this.hash,
      this.rsa!,
      this.sequence,
      this.c,
    );
    return (await decoInstance.doEncryptedPost(
      `;stok=${this.stok}/admin/device`,
      args,
      Buffer.from(JSON.stringify({ operation: 'read' })),
      false,
    )) as DeviceListResponse;
  }

  // Public method to retrieve the list of clients
  async clientList(): Promise<ClientListResponse> {
    console.debug('Requesting client list...');
    const args = new EndpointArgs('client_list');
    const request: RequestParams = {
      operation: 'read',
      params: { device_mac: 'default' },
    };

    const jsonRequest = JSON.stringify(request);
    console.debug(`Client list request JSON: ${jsonRequest}`);
    const decoInstance = new Deco(
      this.aes!,
      this.hash,
      this.rsa!,
      this.sequence,
      this.c,
    );
    const result = (await decoInstance.doEncryptedPost(
      `;stok=${this.stok}/admin/client`,
      args,
      Buffer.from(jsonRequest),
      false,
    )) as ClientListResponse;

    console.debug('Processing client list response...');
    for (const client of result.result.client_list) {
      try {
        const decodedName = Buffer.from(client.name, 'base64').toString(
          'utf-8',
        );
        client.name = decodedName;
        console.debug(`Decoded client name: ${client.name}`);
      } catch (e) {
        console.error(`Failed to decode client name: ${client.name}`, e);
      }
    }

    return result;
  }

  // Public method to reboot devices based on their MAC addresses
  async reboot(...macAddrs: string[]): Promise<{ [key: string]: any }> {
    console.debug(
      `Requesting reboot for MAC addresses: ${macAddrs.join(', ')}`,
    );
    const macList = macAddrs.map((mac) => ({ mac: mac.toUpperCase() }));
    const request: RequestParams = {
      operation: 'reboot',
      params: {
        mac_list: macList,
      },
    };

    const jsonRequest = JSON.stringify(request);
    console.debug(`Reboot request JSON: ${jsonRequest}`);
    const decoInstance = new Deco(
      this.aes!,
      this.hash,
      this.rsa!,
      this.sequence,
      this.c,
    );

    const args = new EndpointArgs('system');
    return (await decoInstance.doEncryptedPost(
      `;stok=${this.stok}/admin/device`,
      args,
      Buffer.from(jsonRequest),
      false,
    )) as { [key: string]: any };
  }

  // Public method to send a custom request to a specific endpoint
  async custom(path: string, params: EndpointArgs, body: Buffer): Promise<any> {
    console.debug(`Sending custom request to path: ${path}`);
    const decoInstance = new Deco(
      this.aes!,
      this.hash,
      this.rsa!,
      this.sequence,
      this.c,
    );
    return await decoInstance.doEncryptedPost(
      `;stok=${this.stok}${path}`,
      params,
      body,
      false,
    );
  }
}

// Function to extract and print details from an RSA KeyObject
function printKey(keyObject: KeyObject): string {
  // Export the key as a DER-encoded buffer
  const keyBuffer = keyObject.export({ type: 'pkcs1', format: 'der' });

  // The modulus for RSA keys is stored in the first part of the key structure
  // Parse the modulus by skipping the header bytes in the DER-encoded key
  const modulusOffset = 29; // Skip the header bytes (this offset can vary slightly)
  const modulusLength = keyBuffer.readUInt16BE(modulusOffset - 2); // Read the modulus length

  // Extract the modulus
  const modulus = keyBuffer.slice(modulusOffset, modulusOffset + modulusLength);

  return (
    'Modulus (hex): ' +
    modulus.toString('hex') +
    'Exponent: ' +
    keyObject.asymmetricKeyDetails?.publicExponent
  );
}
