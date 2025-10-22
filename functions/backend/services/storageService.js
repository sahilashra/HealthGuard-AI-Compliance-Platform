// services/storageService.js
// Google Cloud Storage service for file uploads

const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize GCS client
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GCP_PROJECT_ID
});

const BUCKET_NAME = `${process.env.BUCKET_PREFIX}-uploads` || 'healthguard-ai-hackathon-uploads';

/**
 * Ensure the bucket exists, create if it doesn't
 */
async function ensureBucketExists() {
  try {
    const [buckets] = await storage.getBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`);
      await storage.createBucket(BUCKET_NAME, {
        location: process.env.GCP_REGION || 'us-central1',
        storageClass: 'STANDARD'
      });
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    } else {
      console.log(`Bucket ${BUCKET_NAME} already exists`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

/**
 * Upload a file to Google Cloud Storage
 * @param {Object} file - Multer file object
 * @returns {Object} Upload result with file ID, URL, and metadata
 */
async function uploadFile(file) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword' // DOC
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: PDF, DOCX, DOC. Received: ${file.mimetype}`);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: 10MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Generate unique file ID and name
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const gcsFileName = `${fileId}_${timestamp}${fileExtension}`;

    console.log(`Uploading file to GCS: ${gcsFileName}`);

    // Get bucket reference
    const bucket = storage.bucket(BUCKET_NAME);
    const blob = bucket.file(gcsFileName);

    // Create write stream
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          fileId: fileId
        }
      }
    });

    // Upload file
    await new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('GCS Upload Error:', error);
        reject(error);
      });

      blobStream.on('finish', () => {
        console.log(`File uploaded successfully: ${gcsFileName}`);
        resolve();
      });

      blobStream.end(file.buffer);
    });

    // Get signed URL (valid for 1 hour)
    const [signedUrl] = await blob.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    return {
      success: true,
      fileId: fileId,
      fileName: file.originalname,
      gcsFileName: gcsFileName,
      fileUrl: `gs://${BUCKET_NAME}/${gcsFileName}`,
      signedUrl: signedUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Download a file from Google Cloud Storage
 * @param {string} gcsFileName - The GCS file name
 * @returns {Buffer} File buffer
 */
async function downloadFile(gcsFileName) {
  try {
    console.log(`Downloading file from GCS: ${gcsFileName}`);

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsFileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${gcsFileName}`);
    }

    // Download file
    const [buffer] = await file.download();
    console.log(`File downloaded successfully: ${gcsFileName}`);

    return buffer;

  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Get file metadata from GCS
 * @param {string} gcsFileName - The GCS file name
 * @returns {Object} File metadata
 */
async function getFileMetadata(gcsFileName) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsFileName);

    const [metadata] = await file.getMetadata();

    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      created: metadata.timeCreated,
      updated: metadata.updated,
      customMetadata: metadata.metadata || {}
    };

  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
}

/**
 * Delete a file from GCS
 * @param {string} gcsFileName - The GCS file name
 */
async function deleteFile(gcsFileName) {
  try {
    console.log(`Deleting file from GCS: ${gcsFileName}`);

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsFileName);

    await file.delete();
    console.log(`File deleted successfully: ${gcsFileName}`);

  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * List all files in the bucket
 * @param {string} prefix - Optional prefix to filter files
 * @returns {Array} Array of file objects
 */
async function listFiles(prefix = '') {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [files] = await bucket.getFiles({ prefix });

    return files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      created: file.metadata.timeCreated,
      updated: file.metadata.updated
    }));

  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

module.exports = {
  uploadFile,
  downloadFile,
  getFileMetadata,
  deleteFile,
  listFiles,
  ensureBucketExists,
  BUCKET_NAME
};
