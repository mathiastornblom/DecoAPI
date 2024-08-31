import DecoAPIWraper from '../src/client';
import * as dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

describe('Client Integration Tests', () => {
  // Retrieve Deco password and IP address from environment variables
  const decoPassword = process.env.DECO_PASSWORD || '';
  const client = new DecoAPIWraper(process.env.DECO_IP || '');

  // Test case to verify successful authentication
  it('should authenticate successfully', async () => {
    if (!decoPassword) {
      throw new Error('Deco password is not set in the .env file');
    }

    await client.authenticate(decoPassword);

    // Verify that authentication was successful by checking that 'stok' is set
    expect(client['stok']).toBeTruthy();
  }, 30000); // 30 seconds timeout for the test

  // Test case to fetch performance data
  it('should fetch performance data', async () => {
    const result = await client.performance();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('Performance list:', JSON.stringify(result, null, 2));
    }
  });

  it('should fetch internet status', async () => {
    const result = await client.getInternet();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('Internet:', JSON.stringify(result, null, 2));
    }
  });

  /* // Test case to fetch the client list
  it('should fetch client list', async () => {
    const result = await client.clientList();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('Device list:', JSON.stringify(result, null, 2));
    }
  });

  // Test case to fetch the device list
  it('should fetch device list', async () => {
    const result = await client.deviceList();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('Device list:', JSON.stringify(result, null, 2));
    }
  });

  // Test case to fetch the WAN
  it('should fetch WAN', async () => {
    const result = await client.getWAN();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('WAN:', JSON.stringify(result, null, 2));
    }
  });

  // Test case to fetch the WLAN
  it('should fetch WLAN', async () => {
    const result = await client.getWLAN();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('WLAN:', JSON.stringify(result, null, 2));
    }
  });

  // Test case to fetch the power
  it('should fetch Power', async () => {
    const result = await client.getAdvancedSettings();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('Power:', JSON.stringify(result, null, 2));
    }
  });

  // // Test case to fetch the LAN
  // it('should fetch LAN', async () => {
  //   const result = await client.getLAN();

  //   // Manage the case where the result is an ErrorResponse
  //   if ('errorcode' in result) {
  //     console.warn('Warning:', result.errorcode);
  //     expect(result.errorcode).toBe('no such callback');
  //   } else {
  //     // Check that the response contains the expected properties and values
  //     expect(result).toHaveProperty('error_code', 0);
  //     console.log('LAN:', result);
  //   }
  // });

  // // Test case to fetch the model
  // it('should fetch model', async () => {
  //   const result = await client.getModel();

  //   // Manage the case where the result is an ErrorResponse
  //   if ('errorcode' in result) {
  //     console.warn('Warning:', result.errorcode);
  //     expect(result.errorcode).toBe('no such callback');
  //   } else {
  //     // Check that the response contains the expected properties and values
  //     expect(result).toHaveProperty('error_code', 0);
  //     console.log('Model:', result);
  //   }
  // });

  // Test case to fetch the device firmware
  it('should fetch firmware', async () => {
    const result = await client.firmware();

    // Manage the case where the result is an ErrorResponse
    if ('errorcode' in result) {
      console.warn('Warning:', result.errorcode);
      expect(result.errorcode).toBe('no such callback');
    } else {
      // Check that the response contains the expected properties and values
      expect(result).toHaveProperty('error_code', 0);
      console.log('Firmware:', JSON.stringify(result, null, 2));
    }
  });

  // // Test case to fetch the status
  // it('should fetch status', async () => {
  //   const result = await client.getStatus();

  //   // Manage the case where the result is an ErrorResponse
  //   if ('errorcode' in result) {
  //     console.warn('Warning:', result.errorcode);
  //     expect(result.errorcode).toBe('no such callback');
  //   } else {
  //     // Check that the response contains the expected properties and values
  //     expect(result).toHaveProperty('error_code', 0);
  //     console.log('Status:', result);
  //   }
  // });

  // // Test case to fetch the enviroment
  // it('should fetch enviroment', async () => {
  //   const result = await client.getEnviroment();

  //   // Manage the case where the result is an ErrorResponse
  //   if ('errorcode' in result) {
  //     console.warn('Warning:', result.errorcode);
  //     expect(result.errorcode).toBe('no such callback');
  //   } else {
  //     // Check that the response contains the expected properties and values
  //     expect(result).toHaveProperty('error_code', 0);
  //     console.log('Enviromet:', result);
  //   }
  // }); */
});
