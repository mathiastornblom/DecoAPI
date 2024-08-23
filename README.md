# DecoAPIWapper

DecoAPIWapper is a Node.js-based project designed for making it easy to get information out of tp-link deco routers. This project utilizes various cryptographic utilities and provides a robust testing suite to ensure functionality.

## Table of Contents

- [Installation](#installation)
- [Available methods](#available-methods)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get started with DecoAPI, clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/mathiastornblom/DecoAPIWaper.git
cd DecoAPIWaper
npm install
```

## Available methods

- [x] Performance: Get CPU and Memory usage
- [x] ClientList: Get connected clients
- [x] Custom: Make a custom request to the router
- [x] DeviceList: Get connected Decos
- [x] Reboot: Reboot Deco mesh node(s)

## Usage

Provide a brief description of how to use the project. For example:

```bash
import DecoAPIWraper from 'decoapiwrapper';

const client = new DecoAPIWraper(process.env.DECO_IP || '');

//async authenticate(password: string): Promise<void>
await client.authenticate(decoPassword);
{
  "result": {
    "stok": "d9303c6a85a5206aaabaf2845fe87d24"
  },
  "error_code": 0
}

// async performance(): Promise<PerformanceResponse>
const performance = await client.performance();
console.log('Performance Data:', performance);
{
  "result": {
    "mem_usage": 0.52,
    "cpu_usage": 0.26
  },
  "error_code": 0
}

// async clientList(): Promise<ClientListResponse>
const clientList = await client.clientList();
console.log('Client List:', clientList);
{
  "result": {
    "client_list": [
      {
        "mac": "AA-AA-AA-AA-AA-AA",
        "up_speed": 34,
        "down_speed": 520,
        "wire_type": "wireless",
        "access_host": "1",
        "connection_type": "band2_4",
        "space_id": "1",
        "ip": "192.168.68.52",
        "client_mesh": true,
        "online": true,
        "name": "Name of the device",
        "enable_priority": false,
        "remain_time": 0,
        "owner_id": "",
        "client_type": "pc",
        "interface": "main"
      }
    ]
  },
  "error_code": 0
}

//async deviceList(): Promise<DeviceListResponse>
const deviceList = await client.deviceList();
console.log('Device List:', deviceList);
{
  "result": {
    "device_list": [
      {
        "nand_flash": true,
        "hardware_ver": "1.2",
        "bssid_sta_2g": "",
        "software_ver": "1.2.0 Build 20231229 Rel. 43148",
        "role": "master",
        "bssid_sta_5g": "",
        "inet_status": "online",
        "support_plc": false,
        "oversized_firmware": false,
        "bssid_5g": "FF:FF:FF:FF:FF:FF",
        "set_gateway_support": true,
        "inet_error_msg": "well",
        "group_status": "connected",
        "nickname": "My Deco X50",
        "bssid_2g": "FF:FF:FF:FF:FF:FF",
        "mac": "FF-FF-FF-FF-FF-FF",
        "oem_id": "83acf77142b8234265bc2f7776cf0e38",
        "signal_level": {
          "band5": "0",
          "band2_4": "0"
        },
        "product_level": 200,
        "device_ip": "192.168.68.1",
        "device_model": "X50",
        "hw_id": "8e35a385852db59e22303e0b96fd227c",
        "device_type": "HOMEWIFISYSTEM"
      }
    ]
  },
  "error_code": 0
}

// async reboot(...macAddrs: string[]): Promise<{ [key: string]: any }>
// async custom(path: string, params: EndpointArgs, body: Buffer) Promise<any>
```

### Environment Variables

The project uses environment variables defined in the `.env` file. Make sure to configure them appropriately before running the project.

- `DECO_IP`: IP of your router
- `DECO_PASSWORD`: the password for your tp-link app

## Testing

DecoAPI includes a suite of tests to ensure the integrity of the code. To run the tests, use the following command:

```bash
npm test
```

## Project Structure

A brief overview of the project's structure:

```plaintext
DecoAPI/
├── src/              # Source files
│   ├── client.ts     # Client-related logic
│   ├── deco.ts       # Main entry point
│   └── utils/        # Utility functions (e.g., AES, RSA encryption)
├── tests/            # Test files
│   └── client.test.ts# Unit tests for client
├── .env              # Environment variables
├── .gitignore        # Git ignore rules
├── package.json      # Project dependencies and scripts
└── README.md         # Project documentation
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes. Make sure to follow the code style guidelines and include relevant tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
