import { KeyObject } from 'crypto';
import { AxiosInstance } from 'axios';
import Deco from './deco';
import { AESKey } from './utils/aes';
export interface ErrorResponse {
    errorcode: string;
    success: boolean;
}
export interface ClientListResponse {
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
export interface WLANNetworkResponse {
    error_code: number;
    result: {
        band5_1: {
            backhaul: {
                channel: number;
            };
            guest: {
                password: string;
                ssid: string;
                vlan_id: number;
                enable: boolean;
                need_set_vlan: boolean;
            };
            host: {
                password: string;
                ssid: string;
                channel: number;
                enable: boolean;
                mode: string;
                channel_width: string;
                enable_hide_ssid: boolean;
            };
        };
        is_eg: boolean;
        band2_4: {
            backhaul: {
                channel: number;
            };
            guest: {
                password: string;
                ssid: string;
                vlan_id: number;
                enable: boolean;
                need_set_vlan: boolean;
            };
            host: {
                password: string;
                ssid: string;
                channel: number;
                enable: boolean;
                mode: string;
                channel_width: string;
                enable_hide_ssid: boolean;
            };
        };
    };
}
export interface Band {
    backhaul: {
        channel: number;
    };
    guest: {
        password: string;
        ssid: string;
        vlan_id: number;
        enable: boolean;
        need_set_vlan: boolean;
    };
    host: {
        password: string;
        ssid: string;
        channel: number;
        enable: boolean;
        mode: string;
        channel_width: string;
        enable_hide_ssid: boolean;
    };
}
export interface WANResponse {
    error_code: number;
    result: {
        wan: {
            ip_info: {
                mac: string;
                dns1: string;
                dns2: string;
                mask: string;
                gateway: string;
                ip: string;
            };
            dial_type: string;
            info: string;
            enable_auto_dns: boolean;
        };
        lan: {
            ip_info: {
                mac: string;
                mask: string;
                ip: string;
            };
        };
    };
}
export interface DeviceListResponse {
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
export interface InternetResponse {
    error_code: number;
    result: {
        ipv6: {
            connect_type: string;
            auto_detect_type: string;
            error_code: number;
            inet_status: string;
            dial_status: string;
        };
        ipv4: {
            connect_type: string;
            auto_detect_type: string;
            error_code: number;
            dial_status: string;
            inet_status: string;
        };
        link_status: string;
    };
}
export interface AdvancedResponse {
    error_code: number;
    result: {
        support_dfs: boolean;
    };
}
export interface PerformanceResponse {
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
    authenticate(password: string): Promise<boolean>;
    getAdvancedSettings(): Promise<AdvancedResponse | ErrorResponse>;
    getWLAN(): Promise<WLANNetworkResponse | ErrorResponse>;
    getLAN(): Promise<any>;
    getWAN(): Promise<WANResponse | ErrorResponse>;
    getInternet(): Promise<InternetResponse | ErrorResponse>;
    getModel(): Promise<any | ErrorResponse>;
    getEnviroment(): Promise<any | ErrorResponse>;
    getStatus(): Promise<any | ErrorResponse>;
    firmware(): Promise<any | ErrorResponse>;
    performance(): Promise<PerformanceResponse | ErrorResponse>;
    deviceList(): Promise<DeviceListResponse | ErrorResponse>;
    clientList(): Promise<ClientListResponse | ErrorResponse>;
    reboot(...macAddrs: string[]): Promise<{
        [key: string]: any;
    }>;
    custom(path: string, params: EndpointArgs, body: Buffer): Promise<any | ErrorResponse>;
}
export {};
