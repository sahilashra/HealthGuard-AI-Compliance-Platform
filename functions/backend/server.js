// backend/server.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const functions = require('firebase-functions');

const app = express();

// --- Middleware ---
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true
}));

// --- Raw Request Debugging Middleware ---
app.use((req, res, next) => {
    console.log('=== RAW REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// --- Routes ---
const handleUpload = (req, res, next) => {
  const multerUpload = upload.single('file');
  multerUpload(req, res, (err) => {
    if (err) {
      console.error('❌ Multer Upload Error:', err);
      return res.status(400).json({
        error: 'Upload failed',
        details: err.message,
        code: err.code
      });
    }
    next();
  });
};

app.post('/upload', handleUpload, (req, res, next) => {
  console.log('--- /upload route handler reached ---');
  if (!req.file) {
    console.log('No file found in request.');
    return res.status(400).send('No file uploaded.');
  }
  console.log('File found:', req.file.originalname);
  res.status(200).send({ message: 'File received successfully.' });
});

// --- Global Error Handler ---
app.use((error, req, res, next) => {
    console.error('❌ Unhandled Express Error:', error);
    if (error.stack) {
        console.error('Stack:', error.stack);
    }
    if (!res.headersSent) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message || 'An unexpected error occurred.'
        });
    }
});

module.exports = app;
