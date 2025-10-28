// backend/server.js
// HealthGuard AI Backend - FIXED VERSION WITH BUSBOY

const express = require('express');
const Busboy = require('busboy');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Import services
const storageService = require('./services/storageService');
const documentParser = require('./services/documentParser');
const geminiService = require('./services/geminiService');
const jiraService = require('./services/jiraService');
const sseManager = require('./services/sseManager');

const app = express();

// --- Middleware ---
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- In-Memory Storage for Demo ---
const processedDocuments = new Map();
const activeJobs = new Map();

// --- API Routes ---

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      env_check: {
        gemini_key_exists: !!process.env.GEMINI_API_KEY,
        gemini_key_length: process.env.GEMINI_API_KEY?.length || 0,
        jira_token_exists: !!process.env.JIRA_API_TOKEN
      },
      services: {
        gemini: false,
        jira: false,
        storage: false
      }
    };

    // Check Gemini API
    try {
      health.services.gemini = await geminiService.healthCheck();
    } catch (error) {
      console.error('Gemini health check failed:', error.message);
      health.gemini_error = error.message;
    }

    // Check Jira API
    try {
      health.services.jira = await jiraService.testConnection();
    } catch (error) {
      console.error('Jira health check failed:', error);
    }

    // Check Storage
    try {
      await storageService.ensureBucketExists();
      health.services.storage = true;
    } catch (error) {
      console.error('Storage health check failed:', error);
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed', message: error.message });
  }
});

/**
 * POST /upload
 * Upload a requirements document - FIXED WITH BUSBOY
 */
app.post('/upload', async (req, res) => {
  console.log('=== Upload Request Received (Busboy) ===');
  
  try {
    // Check if rawBody exists (Firebase Functions specific)
    if (!req.rawBody && !req.body) {
      console.error('[ERROR] No rawBody or body found');
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Request body not found'
      });
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
      }
    });

    let fileData = null;
    const fields = {};
    let fileLimitExceeded = false;

    busboy.on('field', (fieldname, val) => {
      console.log('[FIELD]', { fieldname, val });
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      
      console.log('[FILE DETECTED]', {
        fieldname,
        filename,
        mimeType,
        encoding
      });

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];

      if (!allowedTypes.includes(mimeType)) {
        console.error('[ERROR] Invalid file type:', mimeType);
        file.resume();
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: 'Only PDF and DOCX files are allowed'
        });
      }

      // Collect file data in memory
      const chunks = [];
      
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('[FILE BUFFERED]', { filename, size: buffer.length });
        
        fileData = {
          buffer: buffer,
          originalname: filename,
          mimetype: mimeType,
          size: buffer.length
        };
      });

      file.on('error', (error) => {
        console.error('[FILE ERROR]', error);
      });
    });

    busboy.on('filesLimit', () => {
      console.error('[ERROR] File size limit exceeded');
      fileLimitExceeded = true;
    });

    busboy.on('finish', async () => {
      console.log('[BUSBOY FINISH]', {
        hasFile: !!fileData,
        fileLimitExceeded
      });

      if (fileLimitExceeded) {
        return res.status(413).json({
          success: false,
          error: 'File too large',
          message: 'File size exceeds 10MB limit'
        });
      }

      if (!fileData) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please provide a file in the request'
        });
      }

      try {
        console.log(`File ready for processing: ${fileData.originalname} (${fileData.size} bytes)`);

        // Upload to GCS
        const uploadResult = await storageService.uploadFile(fileData);
        console.log(`File uploaded to GCS: ${uploadResult.fileId}`);

        // Parse document
        const parseResult = await documentParser.parseDocument(
          fileData.buffer,
          fileData.mimetype,
          fileData.originalname
        );
        console.log(`Document parsed: ${parseResult.metadata.wordCount} words`);

        // Validate document
        const validation = documentParser.validateHealthcareDocument(parseResult.text);

        // Store processed document
        const docData = {
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.fileUrl,
          text: parseResult.text,
          metadata: {
            ...parseResult.metadata,
            ...uploadResult,
            validation: validation
          },
          uploadedAt: new Date().toISOString()
        };

        processedDocuments.set(uploadResult.fileId, docData);

        // Return success response
        res.json({
          success: true,
          message: 'File uploaded and processed successfully',
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.fileUrl,
          metadata: {
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
            wordCount: parseResult.metadata.wordCount,
            textLength: parseResult.metadata.textLength,
            validation: validation
          }
        });

      } catch (error) {
        console.error('Upload processing error:', error);
        res.status(500).json({
          success: false,
          error: 'Upload failed',
          message: error.message
        });
      }
    });

    busboy.on('error', (error) => {
      console.error('[BUSBOY ERROR]', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Upload processing failed',
          message: error.message
        });
      }
    });

    // THE CRITICAL FIX: Feed rawBody to Busboy
    console.log('[FEEDING BUSBOY]', {
      hasRawBody: !!req.rawBody,
      rawBodyLength: req.rawBody?.length
    });

    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      // Fallback for local development
      req.pipe(busboy);
    }

  } catch (error) {
    console.error('Upload endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

/**
 * GET /process
 * Process a document and stream results via SSE
 */
app.get('/process', async (req, res) => {
  try {
    console.log('=== Process Request Received ===');

    let fileId = req.query.fileId;

    if (!fileId) {
      const docs = Array.from(processedDocuments.values());
      if (docs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No document available',
          message: 'Please upload a document first'
        });
      }
      const lastDoc = docs[docs.length - 1];
      fileId = lastDoc.fileId;
    }

    const docData = processedDocuments.get(fileId);

    if (!docData) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: `Document with fileId ${fileId} not found`
      });
    }

    console.log(`Processing document: ${docData.fileName}`);

    const stream = sseManager.createSimpleStream(res);

    stream.send({
      status: 'inprogress',
      message: 'Starting compliance analysis...',
      fileId: fileId
    });

    const analysisResult = await geminiService.analyzeCompliance(
      docData.text,
      (update) => {
        console.log('Gemini update:', update.message);
        stream.send(update);
      }
    );

    console.log('Compliance analysis complete');

    docData.analysisResult = analysisResult;
    processedDocuments.set(fileId, docData);

    stream.send({
      status: 'complete',
      message: 'Analysis complete',
      fileId: fileId,
      compliance_analysis: {
        compliance_score: analysisResult.compliance_score,
        risk_level: analysisResult.risk_level,
        violations: analysisResult.violations,
        gap_analysis: analysisResult.gap_analysis,
        executive_summary: analysisResult.executive_summary,
        test_case_count: analysisResult.test_cases?.length || 0,
        violation_count: analysisResult.violations?.length || 0,
        gap_count: analysisResult.gap_count || 0
      },
      results: analysisResult.test_cases || []
    });

    setTimeout(() => {
      stream.close();
    }, 1000);

  } catch (error) {
    console.error('Process error:', error);
    try {
      const stream = sseManager.createSimpleStream(res);
      stream.send({
        status: 'error',
        message: error.message,
        error: 'Processing failed'
      });
      stream.close();
    } catch (streamError) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Processing failed',
          message: error.message
        });
      }
    }
  }
});

/**
 * POST /export-to-jira
 * Export test cases to Jira
 */
app.post('/export-to-jira', express.json(), async (req, res) => {
  try {
    console.log('=== Jira Export Request Received ===');

    const { testCases, fileId } = req.body;

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Please provide an array of test cases to export'
      });
    }

    console.log(`Exporting ${testCases.length} test cases to Jira`);

    const jobId = uuidv4();

    activeJobs.set(jobId, {
      jobId: jobId,
      status: 'started',
      totalTestCases: testCases.length,
      startedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      jobId: jobId,
      totalTestCases: testCases.length,
      totalBatches: Math.ceil(testCases.length / 10),
      message: 'Export started. Use jobId to track progress via SSE at /export-status/:jobId'
    });

    (async () => {
      try {
        const results = await jiraService.exportTestCasesToJira(
          testCases,
          (update) => {
            console.log('Jira export update:', update.status);
          }
        );

        const job = activeJobs.get(jobId);
        if (job) {
          job.status = 'completed';
          job.results = results;
          job.completedAt = new Date().toISOString();
        }

        console.log(`Jira export complete: ${results.successful.length} successful`);

      } catch (error) {
        console.error('Jira export error:', error);

        const job = activeJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = error.message;
          job.failedAt = new Date().toISOString();
        }
      }
    })();

  } catch (error) {
    console.error('Export endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error.message
    });
  }
});

/**
 * GET /export-status/:jobId
 * Get status of a Jira export job
 */
app.get('/export-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
      message: `No export job found with ID: ${jobId}`
    });
  }

  res.json({
    success: true,
    ...job
  });
});

/**
 * GET /documents
 * List all processed documents
 */
app.get('/documents', (req, res) => {
  const docs = Array.from(processedDocuments.values()).map(doc => ({
    fileId: doc.fileId,
    fileName: doc.fileName,
    uploadedAt: doc.uploadedAt,
    wordCount: doc.metadata.wordCount,
    hasAnalysis: !!doc.analysisResult
  }));

  res.json({
    success: true,
    documents: docs,
    count: docs.length
  });
});

/**
 * GET /document/:fileId
 * Get details of a specific document
 */
app.get('/document/:fileId', (req, res) => {
  const { fileId } = req.params;
  const doc = processedDocuments.get(fileId);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: 'Document not found',
      message: `Document with fileId ${fileId} not found`
    });
  }

  res.json({
    success: true,
    document: {
      fileId: doc.fileId,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      uploadedAt: doc.uploadedAt,
      metadata: doc.metadata,
      analysis: doc.analysisResult ? {
        compliance_score: doc.analysisResult.compliance_score,
        risk_level: doc.analysisResult.risk_level,
        violation_count: doc.analysisResult.violations?.length || 0,
        test_case_count: doc.analysisResult.test_cases?.length || 0,
        executive_summary: doc.analysisResult.executive_summary
      } : null
    }
  });
});

// --- Error Handler ---
app.use((error, req, res, next) => {
  console.error('❌ Unhandled Express Error:', error);

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// --- Server Initialization ---
const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('=================================');
    console.log('🚀 HealthGuard AI Backend Started (BUSBOY FIXED)');
    console.log('=================================');
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  POST   /upload           - Upload requirements document (Busboy)');
    console.log('  GET    /process          - Process document with SSE streaming');
    console.log('  POST   /export-to-jira   - Export test cases to Jira');
    console.log('  GET    /export-status/:jobId - Get Jira export status');
    console.log('  GET    /documents        - List all documents');
    console.log('  GET    /document/:fileId - Get document details');
    console.log('  GET    /health           - Health check');
    console.log('=================================');

    try {
      console.log('Initializing services...');

      await storageService.ensureBucketExists();
      console.log('✅ Google Cloud Storage initialized');

      const geminiHealthy = await geminiService.healthCheck();
      if (geminiHealthy) {
        console.log('✅ Gemini AI API connected');
      } else {
        console.warn('⚠️  Gemini AI API connection failed');
      }

      const jiraHealthy = await jiraService.testConnection();
      if (jiraHealthy) {
        console.log('✅ Jira API connected');
      } else {
        console.warn('⚠️  Jira API connection failed');
      }

      console.log('');
      console.log('✅ All services initialized');
      console.log('🎯 Backend ready for requests!');

    } catch (error) {
      console.error('❌ Service initialization failed:', error.message);
      console.log('⚠️  Some features may not work correctly');
    }

    console.log('=================================');
  });
}

module.exports = app;
