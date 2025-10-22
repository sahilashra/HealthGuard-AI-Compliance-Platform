# Knowledge Extractor Test Suite

Comprehensive test suite for the Knowledge Extractor backend API.

## Setup

```bash
cd functions/test
npm install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Health check tests only
npm run test:health

# Upload tests only
npm run test:upload

# Integration tests (full workflow)
npm run test:integration
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:coverage
```

## Test Suites

### 1. Health Check Tests (`health.test.js`)
- Tests the `/health` endpoint
- Verifies all services are operational
- Checks environment configuration

### 2. Upload Tests (`upload.test.js`)
- Tests document upload functionality
- Validates file type restrictions
- Verifies document ID generation

### 3. Integration Tests (`integration.test.js`)
- Tests the complete workflow:
  1. Document upload
  2. Compliance analysis
  3. Test case generation
  4. Jira export (optional)
- Validates end-to-end functionality

## Test Configuration

Set the API URL via environment variable:

```bash
# For local testing
export API_URL=http://localhost:5001/healthguard-ai-hackathon/us-central1/api

# For production testing (default)
export API_URL=https://us-central1-healthguard-ai-hackathon.cloudfunctions.net/api
```

## Expected Results

### Health Check Tests
- All tests should pass ✅
- All services should be `true`

### Upload Tests
- Valid uploads should succeed
- Invalid file types should be rejected
- Document IDs should be valid UUIDs

### Integration Tests
- Complete workflow should succeed
- Compliance score should be between 0-100
- Test cases should be generated
- Risk level should be LOW/MEDIUM/HIGH

## Troubleshooting

### Timeout Errors
If tests timeout, increase the timeout in the test file:
```javascript
this.timeout(90000); // 90 seconds
```

### API Connection Issues
1. Check if Firebase Functions are deployed
2. Verify API URL is correct
3. Check Firebase Functions logs: `firebase functions:log`

### Jira Export Failures
Jira export tests may skip if:
- No test cases were generated
- Jira credentials are not configured
- Jira API is unavailable

This is expected and the test will skip gracefully.

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    cd functions/test
    npm install
    npm test
  env:
    API_URL: https://us-central1-healthguard-ai-hackathon.cloudfunctions.net/api
```

## Test Coverage

Run with coverage to see code coverage metrics:

```bash
npm run test:coverage
```

This will generate:
- Console output with coverage percentages
- HTML coverage report in `coverage/` directory

## Adding New Tests

1. Create a new test file in `test/` directory
2. Follow the naming convention: `*.test.js`
3. Import required dependencies:
   ```javascript
   const chai = require('chai');
   const chaiHttp = require('chai-http');
   const { expect } = chai;
   chai.use(chaiHttp);
   ```
4. Add your test suite:
   ```javascript
   describe('My New Feature', () => {
     it('should do something', (done) => {
       // test code
       done();
     });
   });
   ```

## Best Practices

1. Use descriptive test names
2. Set appropriate timeouts for async operations
3. Clean up resources in `after()` hooks
4. Skip tests gracefully when dependencies are unavailable
5. Log important information for debugging
6. Test both success and error cases
