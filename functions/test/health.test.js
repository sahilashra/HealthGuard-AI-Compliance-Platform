/**
 * Health Check API Tests
 * Tests the /health endpoint
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;

chai.use(chaiHttp);

const API_URL = process.env.API_URL || 'https://us-central1-healthguard-ai-hackathon.cloudfunctions.net/api';

describe('Health Check API', () => {
  describe('GET /health', () => {
    it('should return 200 status', (done) => {
      chai.request(API_URL)
        .get('/health')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should return healthy status', (done) => {
      chai.request(API_URL)
        .get('/health')
        .end((err, res) => {
          expect(res.body).to.have.property('status', 'healthy');
          done();
        });
    });

    it('should include all service checks', (done) => {
      chai.request(API_URL)
        .get('/health')
        .end((err, res) => {
          expect(res.body).to.have.property('services');
          expect(res.body.services).to.have.property('gemini');
          expect(res.body.services).to.have.property('jira');
          expect(res.body.services).to.have.property('storage');
          done();
        });
    });

    it('should have all services healthy', (done) => {
      chai.request(API_URL)
        .get('/health')
        .end((err, res) => {
          expect(res.body.services.gemini).to.be.true;
          expect(res.body.services.jira).to.be.true;
          expect(res.body.services.storage).to.be.true;
          done();
        });
    });

    it('should include environment check', (done) => {
      chai.request(API_URL)
        .get('/health')
        .end((err, res) => {
          expect(res.body).to.have.property('env_check');
          expect(res.body.env_check).to.have.property('gemini_key_exists');
          expect(res.body.env_check).to.have.property('jira_token_exists');
          done();
        });
    });

    it('should include timestamp and uptime', (done) => {
      chai.request(API_URL)
        .get('/health')
        .end((err, res) => {
          expect(res.body).to.have.property('timestamp');
          expect(res.body).to.have.property('uptime');
          expect(res.body.uptime).to.be.a('number');
          done();
        });
    });

    it('should have correct environment', (done) => {
      chai.request(API_URL)
        .get('/health')
        .end((err, res) => {
          expect(res.body).to.have.property('environment', 'production');
          done();
        });
    });
  });
});
