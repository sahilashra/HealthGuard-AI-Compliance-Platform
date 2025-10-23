# BigQuery Audit Trail - Migration Guide

## Current Implementation (Working)

The BigQuery audit trail is now **fully functional** using the Project Number workaround for the Data Plane insertAll API.

### Key Discovery

BigQuery has two separate operational planes:
- **Control Plane**: Table operations (create, exists, metadata) - uses Project ID
- **Data Plane**: Streaming ingestion (insertAll) - **requires Project NUMBER**

This is why `createTable()` worked with Project ID but `insert()` failed until we used the Project Number.

### Current Architecture

```
lib/bigqueryDirectInsert.js
├── Uses Project NUMBER (172501365351) for insertAll API calls
├── Direct HTTPS REST API (bypasses @google-cloud/bigquery library bug)
└── Handles authentication with GoogleAuth

bigqueryManager.js
├── Uses BigQuery client (Project ID) for table management
├── Calls insertRowsDirectAPI() for data insertion
└── Converts camelCase to snake_case for BigQuery schema
```

## Future Migration: Storage Write API

### Why Migrate?

The Storage Write API is the modern, recommended approach for streaming data to BigQuery:

1. **Better Performance**: Higher throughput, lower latency
2. **Exactly-Once Semantics**: With committed streams
3. **Schema Evolution**: Automatic schema updates
4. **Cost Optimization**: More efficient than insertAll
5. **No Project Number Workaround**: Works correctly with Project ID

### Migration Path

#### Step 1: Install Storage Write API Library

```bash
npm install @google-cloud/bigquery-storage
```

#### Step 2: Implement Storage Write Client

Create `lib/bigqueryStorageWriter.js`:

```javascript
const { BigQueryWriteClient } = require('@google-cloud/bigquery-storage');
const { adapt } = require('@google-cloud/bigquery-storage/build/src/managedwriter/adapt');

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'healthguard-ai-hackathon';

let writeClient;

function getStorageWriteClient() {
  if (!writeClient) {
    writeClient = new BigQueryWriteClient({
      projectId: PROJECT_ID
    });
  }
  return writeClient;
}

async function insertRowsWithStorageAPI(datasetId, tableId, rows) {
  const client = getStorageWriteClient();

  // Full table path
  const tablePath = `projects/${PROJECT_ID}/datasets/${datasetId}/tables/${tableId}`;

  // Use default stream for simple use case
  const writeStream = await client.createWriteStream({
    parent: tablePath,
    writeStream: {
      type: 'COMMITTED' // For exactly-once delivery
    }
  });

  // Convert rows to protocol buffer format
  const protoRows = {
    serializedRows: rows.map(row => {
      return adapt.convertToProtoValue(row);
    })
  };

  // Append rows
  const request = {
    writeStream: writeStream.name,
    protoRows: protoRows
  };

  const response = await client.appendRows(request);

  // Finalize stream
  await client.finalizeWriteStream({
    name: writeStream.name
  });

  console.log(`✓ Inserted ${rows.length} rows using Storage Write API`);
  return response;
}

module.exports = { insertRowsWithStorageAPI };
```

#### Step 3: Update bigqueryManager.js

```javascript
// Change import
const { insertRowsWithStorageAPI } = require('./lib/bigqueryStorageWriter');

// In logExportEvent function, replace:
await insertRowsDirectAPI(datasetId, tableId, [row], {...});

// With:
await insertRowsWithStorageAPI(datasetId, tableId, [row]);
```

### Migration Timeline

**Phase 1 (Current)**: Project Number workaround - **DONE** ✅
**Phase 2 (Post-Hackathon)**: Storage Write API migration - **TODO**

### Benefits vs Costs

| Aspect | insertAll (Current) | Storage Write API |
|--------|-------------------|------------------|
| Setup Complexity | Low | Medium |
| Performance | Good | Excellent |
| Cost | Standard | Lower |
| Exactly-Once | No | Yes |
| Schema Evolution | Manual | Automatic |
| Project ID Issue | Workaround needed | Native support |

## Recommended Action

**For Hackathon**: Keep current implementation (working, tested, stable)

**Post-Hackathon**: Migrate to Storage Write API for production benefits

## Testing Checklist

Current implementation verified:
- [x] Table creation with Control Plane
- [x] Row insertion with Data Plane (Project Number)
- [x] Data retrieval via queries
- [x] Error handling for partial failures
- [x] Metadata JSON serialization
- [x] snake_case field mapping

## References

- [BigQuery Storage Write API Docs](https://cloud.google.com/bigquery/docs/write-api)
- [Migration Guide](https://cloud.google.com/bigquery/docs/write-api-migration)
- [Node.js Client Library](https://github.com/googleapis/nodejs-bigquery-storage)
