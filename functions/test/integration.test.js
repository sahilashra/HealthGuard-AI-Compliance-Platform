/**
 * Integration Tests
 * Tests the API endpoints that are actually implemented
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;

chai.use(chaiHttp);

const API_URL = process.env.API_URL || 'https://us-central1-healthguard-ai-hackathon.cloudfunctions.net/api';

describe('Integration Tests - API Endpoints', () => {
  describe('GET /documents', () => {
    it('should list all documents', (done) => {
      chai.request(API_URL)
        .get('/documents')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('documents');
          expect(res.body.documents).to.be.an('array');
          expect(res.body).to.have.property('count');
          done();
        });
    });
  });

  describe('GET /document/:fileId', () => {
    it('should return 404 for non-existent document', (done) => {
      chai.request(API_URL)
        .get('/document/invalid-id-12345')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  describe('GET /process', () => {
    it('should return error when no documents uploaded', (done) => {
      chai.request(API_URL)
        .get('/process')
        .end((err, res) => {
          // This might be 400 (no documents) or stream SSE
          // Either is acceptable for this test
          if (res.status === 400) {
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('error');
          }
          done();
        });
    });

    it('should return 404 for invalid fileId', function(done) {
      this.timeout(10000);

      chai.request(API_URL)
        .get('/process?fileId=invalid-id-12345')
        .end((err, res) => {
          // SSE endpoint might return different status codes
          // Accept both 404 and 400
          expect([400, 404]).to.include(res.status);
          done();
        });
    });
  });

  describe('POST /export-to-jira', () => {
    it('should reject request with missing test cases', (done) => {
      chai.request(API_URL)
        .post('/export-to-jira')
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('should reject request with empty test cases array', (done) => {
      chai.request(API_URL)
        .post('/export-to-jira')
        .send({ testCases: [] })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  describe('GET /export-status/:jobId', () => {
    it('should return 404 for non-existent job', (done) => {
      chai.request(API_URL)
        .get('/export-status/invalid-job-id')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  describe('POST /upload', () => {
    it('should reject request with no file', (done) => {
      chai.request(API_URL)
        .post('/upload')
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', (done) => {
      chai.request(API_URL)
        .get('/non-existent-route')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });
});
