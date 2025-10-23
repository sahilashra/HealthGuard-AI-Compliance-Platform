// Direct BigQuery REST API insert using Project Number for Data Plane operations
const { GoogleAuth } = require('google-auth-library');

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'healthguard-ai-hackathon';
// BigQuery's Data Plane (insertAll) requires Project NUMBER, not Project ID
// This is the immutable numeric identifier for the project
const PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER || '172501365351';

// Initialize auth client once (reuse across requests)
let authClient;
let accessTokenCache = { token: null, expiry: null };

async function getAccessToken() {
  // Check if cached token is still valid (with 5-minute buffer)
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiry && accessTokenCache.expiry - now > 300000) {
    return accessTokenCache.token;
  }

  // Initialize auth client if not exists
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/bigquery.insertdata'],
      projectId: PROJECT_ID  // Force project ID explicitly
    });
  }

  // Get new access token
  const client = await authClient.getClient();
  const tokenResponse = await client.getAccessToken();

  // Cache token (expires in 1 hour)
  accessTokenCache = {
    token: tokenResponse.token,
    expiry: now + 3600000 // 1 hour
  };

  return tokenResponse.token;
}

/**
 * Insert rows into BigQuery table using direct REST API
 * This bypasses the project number bug in @google-cloud/bigquery
 *
 * @param {string} datasetId - Dataset ID (e.g., 'exports')
 * @param {string} tableId - Table ID (e.g., 'provider_results')
 * @param {Array<Object>} rows - Array of row objects to insert
 * @param {Object} options - Optional settings
 * @param {boolean} options.skipInvalidRows - Skip rows with errors (default: false)
 * @param {boolean} options.ignoreUnknownValues - Accept rows with extra fields (default: false)
 * @returns {Promise<Object>} - Insert response with potential errors
 */
async function insertRowsDirectAPI(datasetId, tableId, rows, options = {}) {
  try {
    const https = require('https');

    // Get access token
    const accessToken = await getAccessToken();

    // Prepare request payload
    const payload = JSON.stringify({
      kind: 'bigquery#tableDataInsertAllRequest',
      skipInvalidRows: options.skipInvalidRows || false,
      ignoreUnknownValues: options.ignoreUnknownValues || false,
      rows: rows.map((row, index) => ({
        // insertId is optional but helps with deduplication
        insertId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        json: row
      }))
    });

    // CRITICAL: BigQuery's Data Plane (insertAll) requires Project NUMBER, not Project ID
    // Control Plane operations (createTable, exists) use Project ID, but streaming uses NUMBER
    const requestOptions = {
      hostname: 'bigquery.googleapis.com',
      port: 443,
      path: `/bigquery/v2/projects/${PROJECT_NUMBER}/datasets/${datasetId}/tables/${tableId}/insertAll`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'healthguard-ai-hackathon/1.0'
      }
    };

    console.log(`[BigQuery Direct API] POST https://bigquery.googleapis.com${requestOptions.path}`);
    console.log(`[BigQuery Direct API] Using Project Number: ${PROJECT_NUMBER} (Data Plane requirement)`);

    // Execute HTTPS request
    return new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);

            // Check HTTP status
            if (res.statusCode !== 200) {
              console.error(`BigQuery API returned status ${res.statusCode}:`, data);
              reject(new Error(`API returned ${res.statusCode}: ${response.error?.message || data}`));
              return;
            }

            // Check for insert errors
            if (response.insertErrors && response.insertErrors.length > 0) {
              console.error('BigQuery insert errors:', JSON.stringify(response.insertErrors, null, 2));

              // Create error with details
              const error = new Error('Partial insert failure');
              error.name = 'PartialFailureError';
              error.errors = response.insertErrors;
              reject(error);
            } else {
              console.log(`✓ Successfully inserted ${rows.length} row(s) into ${PROJECT_NUMBER}:${datasetId}.${tableId}`);
              resolve(response);
            }
          } catch (parseError) {
            console.error('Failed to parse API response:', data);
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('✗ HTTPS request failed:', error);
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error('✗ insertRowsDirectAPI failed:', error);
    throw error;
  }
}

module.exports = { insertRowsDirectAPI };
