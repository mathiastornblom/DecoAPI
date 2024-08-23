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

    // Check that the response contains the expected properties and values
    expect(result).toHaveProperty('error_code', 0);
    expect(result.result).toHaveProperty('cpu_usage');
    expect(result.result).toHaveProperty('mem_usage');
    console.log('Performance Data:', result);
  });

  // Test case to fetch the client list
  it('should fetch client list', async () => {
    const result = await client.clientList();

    // Check that the response contains the expected properties and values
    expect(result).toHaveProperty('error_code', 0);
    expect(result.result.client_list).toBeInstanceOf(Array);
    expect(result.result.client_list.length).toBeGreaterThan(0);
    console.log('Client List:', result);
  });

  // Test case to fetch the device list
  it('should fetch device list', async () => {
    const result = await client.deviceList();

    // Check that the response contains the expected properties and values
    expect(result).toHaveProperty('error_code', 0);
    expect(result.result.device_list).toBeInstanceOf(Array);
    expect(result.result.device_list.length).toBeGreaterThan(0);
    console.log('Device List:', result);
  });
});
