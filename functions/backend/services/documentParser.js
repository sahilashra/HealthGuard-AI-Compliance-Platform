// services/documentParser.js
// Document parsing service for PDF and DOCX files

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Parse a document buffer and extract text
 * @param {Buffer} buffer - Document buffer
 * @param {string} mimeType - MIME type of the document
 * @param {string} fileName - Original file name
 * @returns {Object} Parsed document with text and metadata
 */
async function parseDocument(buffer, mimeType, fileName) {
  try {
    console.log(`Parsing document: ${fileName} (${mimeType})`);

    let text = '';
    let metadata = {
      fileName: fileName,
      mimeType: mimeType,
      parsedAt: new Date().toISOString()
    };

    if (mimeType === 'application/pdf') {
      // Parse PDF
      const data = await pdfParse(buffer);
      text = data.text;
      metadata.pageCount = data.numpages;
      metadata.info = data.info;

      console.log(`PDF parsed successfully: ${data.numpages} pages`);

    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      // Parse DOCX
      const result = await mammoth.extractRawText({ buffer: buffer });
      text = result.value;

      if (result.messages && result.messages.length > 0) {
        metadata.warnings = result.messages;
        console.log('Document parsing warnings:', result.messages);
      }

      console.log('DOCX parsed successfully');

    } else {
      throw new Error(`Unsupported document type: ${mimeType}`);
    }

    // Clean and normalize text
    text = cleanText(text);

    // Validate text extraction
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    if (text.trim().length < 100) {
      console.warn('Warning: Document appears to have very little text content');
    }

    metadata.textLength = text.length;
    metadata.wordCount = countWords(text);

    console.log(`Document parsed: ${metadata.wordCount} words, ${metadata.textLength} characters`);

    return {
      success: true,
      text: text,
      metadata: metadata
    };

  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error(`Document parsing failed: ${error.message}`);
  }
}

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  if (!text) return '';

  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ');

  // Remove control characters (except newlines and tabs)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize line breaks
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\r/g, '\n');

  // Remove excessive line breaks (more than 2 consecutive)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim
  text = text.trim();

  return text;
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extract requirements from document text (simple heuristic)
 * @param {string} text - Document text
 * @returns {Array} Array of requirement objects
 */
function extractRequirements(text) {
  const requirements = [];

  // Simple pattern matching for common requirement formats
  // Pattern 1: REQ-XXX or R-XXX
  const reqPattern1 = /(?:REQ|R|Req|req)-\d+[:\s]+([^\n]+)/gi;
  let match;

  while ((match = reqPattern1.exec(text)) !== null) {
    requirements.push({
      id: match[0].split(/[:\s]+/)[0],
      text: match[1].trim(),
      type: 'explicit'
    });
  }

  // Pattern 2: "shall", "must", "will" statements (regulatory requirements)
  const sentences = text.split(/[.!?]+/);
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    if (trimmed.length > 20 && /\b(shall|must|will|should)\b/i.test(trimmed)) {
      const reqId = `REQ-IMPLICIT-${String(index + 1).padStart(3, '0')}`;
      requirements.push({
        id: reqId,
        text: trimmed,
        type: 'implicit'
      });
    }
  });

  console.log(`Extracted ${requirements.length} potential requirements from document`);

  return requirements;
}

/**
 * Validate document content for healthcare requirements
 * @param {string} text - Document text
 * @returns {Object} Validation result
 */
function validateHealthcareDocument(text) {
  const warnings = [];
  const suggestions = [];

  // Check for presence of key healthcare terms
  const healthcareTerms = [
    'patient', 'medical', 'health', 'clinical', 'device',
    'hipaa', 'fda', 'compliance', 'regulation'
  ];

  const hasHealthcareTerms = healthcareTerms.some(term =>
    text.toLowerCase().includes(term)
  );

  if (!hasHealthcareTerms) {
    warnings.push('Document does not appear to contain healthcare-related content');
    suggestions.push('Verify that this is a healthcare software requirements document');
  }

  // Check for presence of requirement indicators
  const hasRequirements = /\b(requirement|shall|must|will|should)\b/i.test(text);

  if (!hasRequirements) {
    warnings.push('Document does not appear to contain explicit requirements');
    suggestions.push('Consider uploading a requirements specification document');
  }

  // Check document length
  const wordCount = countWords(text);
  if (wordCount < 500) {
    warnings.push('Document appears to be very short for a requirements specification');
    suggestions.push('Ensure the document is complete and includes all necessary requirements');
  }

  return {
    isValid: warnings.length === 0,
    warnings: warnings,
    suggestions: suggestions,
    wordCount: wordCount,
    hasHealthcareTerms: hasHealthcareTerms,
    hasRequirements: hasRequirements
  };
}

module.exports = {
  parseDocument,
  cleanText,
  countWords,
  extractRequirements,
  validateHealthcareDocument
};
