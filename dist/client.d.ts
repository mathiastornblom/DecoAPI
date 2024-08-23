import { KeyObject } from 'crypto';
import { AxiosInstance } from 'axios';
import Deco from './deco';
import { AESKey } from './utils/aes';
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
interface PerformanceResponse {
    error_code: number;
    result: {
        cpu_usage: number;
        mem_usage: number;
    };
}
declare class EndpointArgs {
    form: string;
    constructor(form: string);
    queryParams(): URLSearchParams;
}
export default class DecoAPIWraper {
    c: AxiosInstance;
    aes: AESKey | undefined;
    rsa: KeyObject | null;
    hash: string;
    stok: string;
    sequence: number;
    host: string;
    decoInstance: Deco | undefined;
    constructor(target: string);
    private pingHost;
    private ensureDecoInstance;
    authenticate(password: string): Promise<void>;
    performance(): Promise<PerformanceResponse>;
    deviceList(): Promise<DeviceListResponse>;
    clientList(): Promise<ClientListResponse>;
    reboot(...macAddrs: string[]): Promise<{
        [key: string]: any;
    }>;
    custom(path: string, params: EndpointArgs, body: Buffer): Promise<any>;
}
export {};
