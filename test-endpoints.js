/**
 * Quick endpoint test script
 * Run with: node test-endpoints.js
 * 
 * Tests that all API endpoints are responding correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, path, expectedStatus, description) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      validateStatus: () => true // Don't throw on any status
    });

    const success = response.status === expectedStatus;
    const icon = success ? '✓' : '✗';
    const color = success ? 'green' : 'red';

    log(color, `${icon} ${method.toUpperCase()} ${path}`);
    log(color, `  Expected: ${expectedStatus}, Got: ${response.status}`);
    log('blue', `  ${description}`);
    
    if (!success) {
      console.log('  Response:', response.data);
    }
    
    console.log('');
    return success;
  } catch (error) {
    log('red', `✗ ${method.toUpperCase()} ${path}`);
    log('red', `  Error: ${error.message}`);
    log('blue', `  ${description}`);
    console.log('');
    return false;
  }
}

async function runTests() {
  log('yellow', '='.repeat(60));
  log('yellow', 'Testing Micro-Credential Aggregator Endpoints');
  log('yellow', '='.repeat(60));
  console.log('');

  const tests = [
    {
      method: 'get',
      path: '/health',
      expectedStatus: 200,
      description: 'Health check endpoint'
    },
    {
      method: 'get',
      path: '/',
      expectedStatus: 200,
      description: 'Root endpoint (API info in dev)'
    },
    {
      method: 'get',
      path: '/api/auth/login',
      expectedStatus: 200,
      description: 'Auth login endpoint (JSON response for API clients)'
    },
    {
      method: 'get',
      path: '/api/auth/status',
      expectedStatus: 400,
      description: 'Auth status (should fail without email param)'
    },
    {
      method: 'get',
      path: '/favicon.ico',
      expectedStatus: 204,
      description: 'Favicon handler (prevents 404)'
    },
    {
      method: 'get',
      path: '/nonexistent',
      expectedStatus: 404,
      description: '404 handler for unknown routes'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await testEndpoint(
      test.method,
      test.path,
      test.expectedStatus,
      test.description
    );
    
    if (success) passed++;
    else failed++;
  }

  log('yellow', '='.repeat(60));
  log('green', `✓ Passed: ${passed}`);
  if (failed > 0) {
    log('red', `✗ Failed: ${failed}`);
  }
  log('yellow', '='.repeat(60));
  console.log('');

  if (failed === 0) {
    log('green', '🎉 All tests passed! Server is configured correctly.');
  } else {
    log('red', '⚠️  Some tests failed. Check server logs for details.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  log('blue', 'Checking if server is running...');
  const isRunning = await checkServer();
  
  if (!isRunning) {
    log('red', '✗ Server is not running on http://localhost:3000');
    log('yellow', '\nPlease start the server first:');
    log('blue', '  npm run dev');
    process.exit(1);
  }
  
  log('green', '✓ Server is running\n');
  
  await runTests();
})();
