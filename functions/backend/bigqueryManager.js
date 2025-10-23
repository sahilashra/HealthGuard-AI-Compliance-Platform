// backend/bigqueryManager.js
const { BigQuery } = require('@google-cloud/bigquery');
const { insertRowsDirectAPI } = require('./lib/bigqueryDirectInsert');

// Configuration constants
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'healthguard-ai-hackathon';
const datasetId = 'exports';
const tableId = 'provider_results';

let bigquery; // Will be initialized on first use

function getBigQueryClient() {
  if (!bigquery) {
    console.log('Initializing BigQuery client with project:', PROJECT_ID);
    bigquery = new BigQuery({
      projectId: PROJECT_ID
    });
    console.log('BigQuery client initialized. Client project ID:', bigquery.projectId);
  }
  return bigquery;
}

/**
 * Ensures the BigQuery dataset and table exist, creating them if necessary.
 * This function will only execute if BigQuery is enabled.
 */
async function logExportEvent(eventData) {
  const bq = getBigQueryClient();
  if (!bq) {
    console.warn('BigQuery client not available, skipping audit trail.');
    return;
  }

  try {
    // Don't pass projectId to dataset - it inherits from the client
    const dataset = bq.dataset(datasetId);
    const table = dataset.table(tableId);

    // Check if dataset exists, create if not
    try {
      const [datasetExists] = await dataset.exists();
      if (!datasetExists) {
        await bq.createDataset(datasetId);
        console.log(`Dataset ${datasetId} created.`);
      }
    } catch (dsError) {
      console.error('Error checking/creating dataset:', dsError.message);
      return;
    }

    // Check if table exists, create if not
    try {
      const [tableExists] = await table.exists();
      if (!tableExists) {
        const schema = {
          fields: [
            { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
            { name: 'job_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'event_type', type: 'STRING', mode: 'REQUIRED' },
            { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
            { name: 'document_name', type: 'STRING', mode: 'NULLABLE' },
            { name: 'compliance_score', type: 'INTEGER', mode: 'NULLABLE' },
            { name: 'test_case_count', type: 'INTEGER', mode: 'NULLABLE' },
            { name: 'violation_count', type: 'INTEGER', mode: 'NULLABLE' },
            { name: 'risk_level', type: 'STRING', mode: 'NULLABLE' },
            { name: 'status', type: 'STRING', mode: 'REQUIRED' },
            { name: 'metadata', type: 'JSON', mode: 'NULLABLE' }
          ]
        };
        await dataset.createTable(tableId, { schema });
        console.log(`Table ${tableId} created.`);
        // Wait a moment for table to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (tableError) {
      console.error('Error checking/creating table:', tableError.message);
      return;
    }

    // Insert row - convert camelCase to snake_case for BigQuery
    const row = {
      timestamp: new Date().toISOString(),
      job_id: eventData.jobId,
      event_type: eventData.eventType,
      user_id: eventData.userId || null,
      document_name: eventData.documentName || null,
      compliance_score: eventData.complianceScore !== undefined ? eventData.complianceScore : null,
      test_case_count: eventData.testCaseCount !== undefined ? eventData.testCaseCount : null,
      violation_count: eventData.violationCount !== undefined ? eventData.violationCount : null,
      risk_level: eventData.riskLevel || null,
      status: eventData.status,
      // JSON type in BigQuery accepts either JSON string or object
      metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null
    };

    // Use direct REST API to bypass project number bug in @google-cloud/bigquery
    try {
      await insertRowsDirectAPI(datasetId, tableId, [row], {
        skipInvalidRows: false,
        ignoreUnknownValues: false
      });
      console.log(`Export event logged to BigQuery for jobId: ${eventData.jobId}`);
    } catch (insertError) {
      // Log more detailed error info
      console.error('BigQuery insert error details:', insertError.name, insertError.message);
      if (insertError.errors && insertError.errors.length > 0) {
        console.error('Insert errors:', JSON.stringify(insertError.errors, null, 2));
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Error logging to BigQuery:', error.message);
    // Don't throw - we don't want BigQuery failures to break the main flow
  }
}

/**
 * Fetches all export events for a given job ID from BigQuery.
 * Returns an empty array if BigQuery is disabled.
 * @param {string} jobId - The ID of the export job.
 * @returns {Promise<Array>} An array of log entry objects.
 */
async function getExportEvents(jobId) {
  const bq = getBigQueryClient();
  if (!bq) {
    console.warn('BigQuery client not available.');
    return [];
  }

  try {
    const query = `
      SELECT
        timestamp,
        job_id,
        event_type,
        document_name,
        compliance_score,
        test_case_count,
        violation_count,
        risk_level,
        status,
        metadata
      FROM \`${PROJECT_ID}.${datasetId}.${tableId}\`
      WHERE job_id = @jobId
      ORDER BY timestamp DESC
    `;

    const options = {
      query: query,
      params: { jobId: jobId }
    };

    const [rows] = await bq.query(options);
    console.log(`Retrieved ${rows.length} events for jobId: ${jobId}`);
    return rows;
  } catch (error) {
    console.error('Error fetching from BigQuery:', error);
    return [];
  }
}

module.exports = { logExportEvent, getExportEvents };