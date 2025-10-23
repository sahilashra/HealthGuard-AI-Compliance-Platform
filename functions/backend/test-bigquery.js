// Test BigQuery integration
require('./preload.js');
const { logExportEvent, getExportEvents } = require('./bigqueryManager');

async function testBigQuery() {
  console.log('=== Testing BigQuery Integration ===\n');

  const testJobId = 'test-job-' + Date.now();

  // Test 1: Log an event
  console.log('Test 1: Logging export event...');
  try {
    await logExportEvent({
      jobId: testJobId,
      eventType: 'ANALYSIS_COMPLETE',
      documentName: 'test_healthcare_requirements.pdf',
      complianceScore: 85,
      testCaseCount: 42,
      violationCount: 3,
      riskLevel: 'MEDIUM',
      status: 'SUCCESS',
      metadata: {
        testRun: true,
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Event logged successfully!\n');
  } catch (error) {
    console.error('❌ Failed to log event:', error.message);
    return;
  }

  // Test 2: Wait a moment for BigQuery to process
  console.log('Waiting 3 seconds for BigQuery to process...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 3: Retrieve the event
  console.log('\nTest 2: Retrieving export events...');
  try {
    const events = await getExportEvents(testJobId);
    console.log(`✅ Retrieved ${events.length} event(s)`);

    if (events.length > 0) {
      console.log('\nEvent details:');
      console.log(JSON.stringify(events[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Failed to retrieve events:', error.message);
  }

  console.log('\n=== BigQuery Test Complete ===');
  process.exit(0);
}

testBigQuery().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
