import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const GATEWAY_URL = 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';
const TEST_FILE_PATH = path.join(__dirname, 'test-video.mp4');

async function runIntegrationTest() {
  try {
    console.log('Starting Integration Test...');

    // 0. Create a dummy video file
    if (!fs.existsSync(TEST_FILE_PATH)) {
      fs.writeFileSync(TEST_FILE_PATH, 'dummy video content');
    }

    // 1. Register
    console.log(`1. Registering user: ${TEST_EMAIL}`);
    await axios.post(`${GATEWAY_URL}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Test User',
    });
    console.log('   Registration successful.');

    // 2. Login
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${GATEWAY_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const token = loginResponse.data.access_token;
    console.log('   Login successful. Token received.');

    // 3. Upload Video
    console.log('3. Uploading video...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_FILE_PATH));

    const uploadResponse = await axios.post(
      `${GATEWAY_URL}/converter/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const { fileId, filename } = uploadResponse.data;
    console.log(
      `   Upload successful. FileID: ${fileId}, Filename: ${filename}`,
    );

    // 4. Poll for Download
    console.log('4. Polling for download...');
    const maxRetries = 20;
    const delay = 1000; // 1 second

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`   Attempt ${i + 1}/${maxRetries}...`);
        const downloadUrl = `${GATEWAY_URL}/converter/download/${filename}`;
        await axios.get(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'stream',
        });

        console.log('   Download successful!');

        // Cleanup
        if (fs.existsSync(TEST_FILE_PATH)) {
          fs.unlinkSync(TEST_FILE_PATH);
        }

        console.log('Integration Test PASSED!');
        return;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 404) {
            // File not found yet (conversion pending), wait and retry
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else if (error.response.status === 500) {
            // Conversion might have failed or service error
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    throw new Error('Timeout waiting for conversion.');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Integration Test FAILED:', error.message);
    } else {
      console.error('Integration Test FAILED:', error);
    }

    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

runIntegrationTest();
