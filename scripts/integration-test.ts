import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const GATEWAY_URL = 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';
const INPUT_FILE = path.join(__dirname, 'sample-5s.mp4');
const OUTPUT_FILE = path.join(__dirname, 'converted-sample-5s.mp3');

async function runIntegrationTest() {
  console.log('Starting Integration Test...');

  try {
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
    if (!fs.existsSync(INPUT_FILE)) {
      throw new Error(`Input file not found: ${INPUT_FILE}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(INPUT_FILE));

    const uploadResponse = await axios.post(
      `${GATEWAY_URL}/converter/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
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
    const retryDelay = 2000; // 2 seconds

    for (let i = 0; i < maxRetries; i++) {
      console.log(`   Attempt ${i + 1}/${maxRetries}...`);
      try {
        const downloadResponse = await axios.get(
          `${GATEWAY_URL}/converter/download/${filename}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'stream',
          },
        );

        // If successful, save the file
        const writer = fs.createWriteStream(OUTPUT_FILE);
        downloadResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        console.log(`   Download successful! Saved to ${OUTPUT_FILE}`);
        console.log('Integration Test PASSED!');
        return;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.log('Caught error:', errorMessage);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          console.log('Response status:', axiosError.response?.status);
          console.log(
            'Response status type:',
            typeof axiosError.response?.status,
          );
        } else {
          console.log('No response object in error');
        }

        if (
          (error &&
            typeof error === 'object' &&
            'response' in error &&
            (error as { response?: { status?: number } }).response?.status ===
              404) ||
          errorMessage.includes('404')
        ) {
          // File not ready yet, wait and retry
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          throw error;
        }
      }
    }

    throw new Error('Timeout waiting for conversion.');
  } catch (error: unknown) {
    console.error('Integration Test FAILED:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
      };
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', axiosError.response?.data);
    }
    process.exit(1);
  }
}

runIntegrationTest();
