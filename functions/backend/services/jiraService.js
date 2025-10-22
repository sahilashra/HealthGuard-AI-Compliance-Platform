// services/jiraService.js
// Jira API integration for test case export

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Jira configuration - read from environment variables
const JIRA_CONFIG = {
  baseUrl: process.env.JIRA_BASE_URL || 'https://sahilashraf93.atlassian.net',
  email: process.env.JIRA_EMAIL || 'sahilashraf93@gmail.com',
  apiToken: process.env.JIRA_API_TOKEN,
  projectKey: process.env.JIRA_PROJECT_KEY || 'CCS'
};

// Validate configuration
if (!JIRA_CONFIG.apiToken) {
  console.warn('WARNING: JIRA_API_TOKEN not configured. Jira export will not work.');
}

/**
 * Create authorization header for Jira API
 * @returns {string} Base64 encoded auth string
 */
function getAuthHeader() {
  const auth = Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');
  return `Basic ${auth}`;
}

/**
 * Test Jira API connection
 * @returns {boolean} True if connection successful
 */
async function testConnection() {
  try {
    console.log('Testing Jira API connection...');

    const response = await axios.get(
      `${JIRA_CONFIG.baseUrl}/rest/api/3/myself`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Accept': 'application/json'
        }
      }
    );

    console.log('Jira connection successful:', response.data.displayName);
    return true;

  } catch (error) {
    console.error('Jira connection test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Get available issue types for the project
 * @returns {Array} Array of issue types
 */
async function getIssueTypes() {
  try {
    const response = await axios.get(
      `${JIRA_CONFIG.baseUrl}/rest/api/3/issue/createmeta?projectKeys=${JIRA_CONFIG.projectKey}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Accept': 'application/json'
        }
      }
    );

    const project = response.data.projects[0];
    if (!project) {
      throw new Error(`Project ${JIRA_CONFIG.projectKey} not found`);
    }

    return project.issuetypes;

  } catch (error) {
    console.error('Error getting issue types:', error.response?.data || error.message);
    return ['Task']; // Fallback to Task
  }
}

/**
 * Create a single Jira issue for a test case
 * @param {Object} testCase - Test case object
 * @returns {Object} Created issue details
 */
async function createJiraIssue(testCase) {
  try {
    console.log(`Creating Jira issue for test case: ${testCase.test_case_id}`);

    // Format the description in Atlassian Document Format (ADF)
    const description = formatDescriptionADF(testCase);

    const issueData = {
      fields: {
        project: {
          key: JIRA_CONFIG.projectKey
        },
        summary: `[${testCase.test_case_id}] ${testCase.title}`,
        description: description,
        issuetype: {
          name: 'Task' // Using Task type - can be changed to Test if available
        }
      }
    };

    const response = await axios.post(
      `${JIRA_CONFIG.baseUrl}/rest/api/3/issue`,
      issueData,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const issue = response.data;

    console.log(`Jira issue created: ${issue.key}`);

    return {
      id: issue.id,
      key: issue.key,
      link: `${JIRA_CONFIG.baseUrl}/browse/${issue.key}`,
      original_test_case_id: testCase.test_case_id,
      self: issue.self
    };

  } catch (error) {
    console.error('Error creating Jira issue:', error.response?.data || error.message);
    throw new Error(`Failed to create Jira issue: ${error.response?.data?.errors || error.message}`);
  }
}

/**
 * Format test case description in Atlassian Document Format (ADF)
 * @param {Object} testCase - Test case object
 * @returns {Object} ADF formatted description
 */
function formatDescriptionADF(testCase) {
  const content = [];

  // Test Case ID
  content.push({
    type: 'heading',
    attrs: { level: 3 },
    content: [{ type: 'text', text: 'Test Case Details', marks: [{ type: 'strong' }] }]
  });

  // Test Case ID
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Test Case ID: ', marks: [{ type: 'strong' }] },
      { type: 'text', text: testCase.test_case_id }
    ]
  });

  // Requirement ID
  if (testCase.requirement_id) {
    content.push({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Requirement ID: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: testCase.requirement_id }
      ]
    });
  }

  // Description
  content.push({
    type: 'heading',
    attrs: { level: 3 },
    content: [{ type: 'text', text: 'Description' }]
  });

  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: testCase.description || 'No description provided' }]
  });

  // Test Steps
  if (testCase.steps && Array.isArray(testCase.steps)) {
    content.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Test Steps' }]
    });

    content.push({
      type: 'orderedList',
      content: testCase.steps.map(step => ({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: step }]
        }]
      }))
    });
  }

  // Expected Results
  if (testCase.expected_results && Array.isArray(testCase.expected_results)) {
    content.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Expected Results' }]
    });

    content.push({
      type: 'bulletList',
      content: testCase.expected_results.map(result => ({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: result }]
        }]
      }))
    });
  }

  // Compliance Metadata
  if (testCase.compliance_metadata && testCase.compliance_metadata.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Compliance Requirements' }]
    });

    testCase.compliance_metadata.forEach(meta => {
      content.push({
        type: 'paragraph',
        content: [
          { type: 'text', text: `${meta.compliance_id}: `, marks: [{ type: 'strong' }] },
          { type: 'text', text: `${meta.compliance_title} (${meta.compliance_source})` }
        ]
      });
    });
  }

  return {
    type: 'doc',
    version: 1,
    content: content
  };
}

/**
 * Export test cases to Jira in batches
 * @param {Array} testCases - Array of test cases
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Object} Export results
 */
async function exportTestCasesToJira(testCases, progressCallback = null) {
  try {
    console.log(`Starting Jira export for ${testCases.length} test cases`);

    // Validate configuration
    if (!JIRA_CONFIG.apiToken) {
      throw new Error('Jira API token not configured. Please set JIRA_API_TOKEN environment variable.');
    }

    const jobId = uuidv4();
    const batchSize = 10;
    const totalBatches = Math.ceil(testCases.length / batchSize);

    const results = {
      jobId: jobId,
      totalTestCases: testCases.length,
      totalBatches: totalBatches,
      successful: [],
      failed: [],
      errors: []
    };

    if (progressCallback) {
      progressCallback({
        status: 'export-started',
        jobId: jobId,
        totalTestCases: testCases.length,
        totalBatches: totalBatches
      });
    }

    // Process in batches
    for (let i = 0; i < testCases.length; i += batchSize) {
      const batch = testCases.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`Processing batch ${batchNumber}/${totalBatches}`);

      const batchResults = await Promise.allSettled(
        batch.map(testCase => createJiraIssue(testCase))
      );

      const batchIssues = [];

      batchResults.forEach((result, index) => {
        const testCase = batch[index];

        if (result.status === 'fulfilled') {
          results.successful.push(result.value);
          batchIssues.push(result.value);
        } else {
          const error = {
            test_case_id: testCase.test_case_id,
            error: result.reason.message
          };
          results.failed.push(error);
          results.errors.push(error);
        }
      });

      // Send progress update after each batch
      if (progressCallback) {
        progressCallback({
          status: 'batch-complete',
          batchNumber: batchNumber,
          totalBatches: totalBatches,
          issues: batchIssues,
          successCount: results.successful.length,
          failedCount: results.failed.length
        });
      }

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < testCases.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (progressCallback) {
      progressCallback({
        status: 'export-complete',
        jobId: jobId,
        successCount: results.successful.length,
        failedCount: results.failed.length
      });
    }

    console.log(`Jira export complete: ${results.successful.length} successful, ${results.failed.length} failed`);

    return results;

  } catch (error) {
    console.error('Error in Jira export:', error);
    throw error;
  }
}

/**
 * Get Jira project information
 * @returns {Object} Project details
 */
async function getProjectInfo() {
  try {
    const response = await axios.get(
      `${JIRA_CONFIG.baseUrl}/rest/api/3/project/${JIRA_CONFIG.projectKey}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Accept': 'application/json'
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error getting project info:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  testConnection,
  getIssueTypes,
  createJiraIssue,
  exportTestCasesToJira,
  getProjectInfo,
  JIRA_CONFIG
};
