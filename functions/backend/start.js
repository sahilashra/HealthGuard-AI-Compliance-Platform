#!/usr/bin/env node

// Startup script with enhanced error handling and diagnostics
console.log('=== HealthGuard AI Backend Startup ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 8080);

// Check critical environment variables
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'GCP_PROJECT_ID',
  'JIRA_API_TOKEN'
];

console.log('\n=== Environment Check ===');
let missingVars = [];
for (const varName of requiredEnvVars) {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.warn(`\n⚠️  Warning: ${missingVars.length} environment variable(s) missing`);
  console.warn('Some features may not work correctly');
}

console.log('\n=== Starting Server ===');

try {
  // Load the main server
  const app = require('./server.js');
  
  console.log('✅ Server module loaded successfully');
  
} catch (error) {
  console.error('❌ Failed to start server:');
  console.error(error);
  process.exit(1);
}
