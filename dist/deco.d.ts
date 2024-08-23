import { AESKey } from './utils/aes';
import { AxiosInstance } from 'axios';
import { KeyObject } from 'crypto';
interface EndpointArgs {
    form: string;
}
export default class Deco {
    private aes;
    private hash;
    private rsa;
    private sequence;
    private c;
    constructor(aes: AESKey, hash: string, rsa: KeyObject, sequence: number, httpClient: AxiosInstance);
    static generateAESKey(): AESKey;
    getPasswordKey(): Promise<KeyObject | null>;
    getSessionKey(): Promise<{
        key: KeyObject | null;
        seq: number;
    }>;
    doEncryptedPost(path: string, params: EndpointArgs, body: Buffer, isLogin: boolean, key?: KeyObject, sequence?: number): Promise<any>;
    doPost(path: string, params: EndpointArgs, body: Buffer): Promise<any>;
}
export {};
