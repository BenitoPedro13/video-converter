// Set environment variables for E2E tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.AUTH_SERVICE_URL = 'http://localhost:3001';
process.env.CONVERTER_SERVICE_URL = 'http://localhost:3002';
process.env.NOTIFICATION_SERVICE_URL = 'http://localhost:3003';
