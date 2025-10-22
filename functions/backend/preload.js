// preload.js
// Load environment variables before application starts

const path = require('path');
const dotenv = require('dotenv');

// Load .env file from project root
const envPath = path.join(__dirname, '..', '..', '.env');

console.log('Loading environment variables from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Warning: Could not load .env file:', result.error.message);
  console.log('Will use environment variables from system');
} else {
  console.log('✅ Environment variables loaded successfully');
}

// Validate critical environment variables
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'GCP_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS'
];

const missing = requiredEnvVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}`);
  console.log('Some features may not work correctly');
}

// Log configuration (without sensitive values)
console.log('');
console.log('Configuration loaded:');
console.log('  GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID || '(not set)');
console.log('  GCP_REGION:', process.env.GCP_REGION || '(not set)');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('  GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Set' : '❌ Not set');
console.log('  JIRA_BASE_URL:', process.env.JIRA_BASE_URL || '(not set)');
console.log('  JIRA_API_TOKEN:', process.env.JIRA_API_TOKEN ? '✅ Set' : '❌ Not set');
console.log('  JIRA_PROJECT_KEY:', process.env.JIRA_PROJECT_KEY || '(not set)');
console.log('  PORT:', process.env.PORT || '8080 (default)');
console.log('');
