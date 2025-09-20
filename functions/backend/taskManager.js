const functions = require('firebase-functions');
const functions = require('firebase-functions');
// backend/taskManager.js
const { CloudTasksClient } = require('@google-cloud/tasks');
let client; // Will be initialized on first use

function getTasksClient() {
  if (!client) {
    client = new CloudTasksClient();
  }
  return client;
}

const project = functions.config().healthguard.gcp_project_id;
const location = functions.config().healthguard.gcp_region;
const queue = 'jira-export-queue'; // The name of your queue in Cloud Tasks
const processorUrl = functions.config().healthguard.jira_batch_processor_url;



/**
 * Creates a task to process a batch of Jira issues.
 * @param {Array} batch - An array of test case objects for Jira.
 * @returns {Promise<void>}
 */
async function createJiraBatchTask(batch) {
  const tasksClient = getTasksClient();
  const parent = tasksClient.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: processorUrl, // The URL of our /process-jira-batch endpoint
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(JSON.stringify(batch)).toString('base64'),
    },
  };

  try {
    console.log('Creating Cloud Task for batch...');
    const [response] = await tasksClient.createTask({ parent, task });
    console.log(`Created task ${response.name}`);
  } catch (error) {
    console.error('Error creating Cloud Task:', error);
    // In a real app, you'd want more robust error handling, maybe a retry or alert.
    throw new Error('Failed to create a batch processing task.');
  }
}

module.exports = { createJiraBatchTask };
