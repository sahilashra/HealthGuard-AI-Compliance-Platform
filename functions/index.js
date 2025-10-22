// Load environment variables FIRST before any other imports
require('dotenv').config();

const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const server = require("./backend/server");

// Define environment parameters (reads from .env during deployment)
const geminiApiKey = defineString('GEMINI_API_KEY');
const jiraBaseUrl = defineString('JIRA_BASE_URL');
const jiraEmail = defineString('JIRA_EMAIL');
const jiraApiToken = defineString('JIRA_API_TOKEN');
const jiraProjectKey = defineString('JIRA_PROJECT_KEY');

// Export the backend API with increased timeout and memory
exports.api = onRequest(
  {
    timeoutSeconds: 540, // 9 minutes (max for Firebase Functions)
    memory: "2GiB",
    maxInstances: 10
  },
  server
);

// Keep old endpoint for backward compatibility
exports.apiV2 = onRequest(
  {
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 10
  },
  server
);
