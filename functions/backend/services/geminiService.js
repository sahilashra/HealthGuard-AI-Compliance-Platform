// services/geminiService.js
// Gemini AI integration for compliance analysis and test case generation

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getComplianceKnowledgeBase, determineRiskLevel } = require('./complianceKnowledge');

// Get API key from environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY not configured. Gemini AI features will not work.');
}

// Initialize Gemini AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Analyze a requirements document for compliance
 * @param {string} documentText - The document text to analyze
 * @param {Function} updateCallback - Optional callback for progress updates
 * @returns {Object} Compliance analysis result
 */
async function analyzeCompliance(documentText, updateCallback = null) {
  try {
    console.log('Starting compliance analysis with Gemini AI...');

    if (updateCallback) {
      updateCallback({ status: 'inprogress', message: 'Initializing Gemini AI analysis...' });
    }

    // Get the compliance knowledge base
    const complianceKnowledge = getComplianceKnowledgeBase();

    if (updateCallback) {
      updateCallback({ status: 'inprogress', message: 'Analyzing document for compliance violations...' });
    }

    // Create the analysis prompt
    const analysisPrompt = `
You are a healthcare software compliance expert specializing in FDA, HIPAA, and ISO 13485 regulations.

TASK: Analyze the following software requirements document for compliance with healthcare regulations.

REQUIREMENTS DOCUMENT:
${documentText.substring(0, 50000)}

COMPLIANCE KNOWLEDGE BASE:
${complianceKnowledge}

OUTPUT FORMAT (JSON):
{
  "compliance_score": <0-100 integer>,
  "risk_level": "<LOW|MEDIUM|HIGH>",
  "violations": [
    {
      "type": "regulation name",
      "description": "detailed description",
      "suggestion": "how to fix it"
    }
  ],
  "executive_summary": "brief summary of compliance status",
  "test_cases": [
    {
      "test_case_id": "TC-XXX",
      "title": "short title",
      "description": "detailed description with steps",
      "requirement_id": "REQ-XXX from document",
      "compliance_metadata": [
        {
          "compliance_id": "regulation section",
          "compliance_title": "requirement name",
          "compliance_source": "regulation name"
        }
      ]
    }
  ]
}

RULES:
1. Be thorough and identify ALL potential violations
2. Provide actionable suggestions for each violation
3. Generate comprehensive test cases that verify compliance
4. Link each test case to specific requirements and regulations
5. Risk level: HIGH if FDA Class III or critical HIPAA violations found
6. Generate at least 20-50 test cases for a typical document
7. Use JSON format exactly as specified above
8. IMPORTANT: Return ONLY valid JSON, no markdown formatting, no explanations outside the JSON
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3, // More deterministic for compliance
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 32768, // Increased to handle larger test case responses
        responseMimeType: "application/json",
      }
    });

    console.log('Sending request to Gemini AI...');
    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const responseText = response.text();

    console.log('Received response from Gemini AI');

    if (updateCallback) {
      updateCallback({ status: 'inprogress', message: 'Parsing AI response...' });
    }

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Response text:', responseText);

      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       responseText.match(/```\s*([\s\S]*?)\s*```/);

      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse Gemini AI response as JSON');
      }
    }

    // Validate and enhance the response
    analysisResult = validateAndEnhanceResponse(analysisResult);

    if (updateCallback) {
      updateCallback({
        status: 'inprogress',
        message: `Analysis complete: ${analysisResult.compliance_score}% compliant, ${analysisResult.test_cases?.length || 0} test cases generated`
      });
    }

    console.log(`Compliance analysis complete: Score ${analysisResult.compliance_score}, ${analysisResult.test_cases?.length || 0} test cases`);

    return {
      success: true,
      ...analysisResult
    };

  } catch (error) {
    console.error('Error in Gemini compliance analysis:', error);
    throw new Error(`Compliance analysis failed: ${error.message}`);
  }
}

/**
 * Validate and enhance the Gemini response
 * @param {Object} response - Raw response from Gemini
 * @returns {Object} Validated and enhanced response
 */
function validateAndEnhanceResponse(response) {
  // Ensure all required fields exist
  const validated = {
    compliance_score: response.compliance_score || 0,
    risk_level: response.risk_level || 'MEDIUM',
    violations: response.violations || [],
    executive_summary: response.executive_summary || 'Compliance analysis completed.',
    test_cases: response.test_cases || [],
    results: response.test_cases || [] // Alias for frontend compatibility
  };

  // Validate compliance score
  if (validated.compliance_score < 0) validated.compliance_score = 0;
  if (validated.compliance_score > 100) validated.compliance_score = 100;

  // Validate risk level
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(validated.risk_level)) {
    validated.risk_level = determineRiskLevel(validated.violations);
  }

  // Ensure test cases have required fields
  validated.test_cases = validated.test_cases.map((tc, index) => ({
    test_case_id: tc.test_case_id || `TC-${String(index + 1).padStart(3, '0')}`,
    title: tc.title || 'Compliance Test Case',
    description: tc.description || 'Verify compliance requirement',
    requirement_id: tc.requirement_id || 'REQ-000',
    compliance_metadata: tc.compliance_metadata || [],
    steps: tc.steps || [tc.description],
    expected_results: tc.expected_results || ['Requirement is met']
  }));

  validated.results = validated.test_cases;

  // Add metadata
  validated.analyzed_at = new Date().toISOString();
  validated.test_case_count = validated.test_cases.length;
  validated.violation_count = validated.violations.length;

  return validated;
}

/**
 * Generate additional test cases for specific requirements
 * @param {string} requirement - Requirement text
 * @param {string} complianceContext - Relevant compliance context
 * @returns {Array} Array of test cases
 */
async function generateTestCases(requirement, complianceContext) {
  try {
    console.log('Generating test cases for requirement...');

    const prompt = `
You are a healthcare software test engineer expert.

Generate detailed test cases for this requirement:
${requirement}

Consider these compliance requirements:
${complianceContext.substring(0, 5000)}

Return JSON array of test cases with this format:
[
  {
    "test_case_id": "TC-XXX",
    "title": "test title",
    "description": "detailed description",
    "steps": ["step 1", "step 2", "step 3"],
    "expected_results": ["expected result 1", "expected result 2"],
    "compliance_metadata": [
      {
        "compliance_id": "regulation section",
        "compliance_title": "requirement name",
        "compliance_source": "regulation name"
      }
    ]
  }
]

Generate 3-5 comprehensive test cases. Return ONLY valid JSON.
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let testCases = JSON.parse(responseText);

    // Ensure it's an array
    if (!Array.isArray(testCases)) {
      testCases = [testCases];
    }

    console.log(`Generated ${testCases.length} test cases`);

    return testCases;

  } catch (error) {
    console.error('Error generating test cases:', error);
    throw error;
  }
}

/**
 * Get AI explanation for a compliance violation
 * @param {Object} violation - Violation object
 * @returns {string} Plain English explanation
 */
async function explainViolation(violation) {
  try {
    const prompt = `
Explain this compliance violation in simple terms that a software developer can understand:

Violation Type: ${violation.type}
Description: ${violation.description}

Provide:
1. What the violation means
2. Why it matters
3. How to fix it (in practical terms)

Keep the explanation concise (2-3 paragraphs).
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();

  } catch (error) {
    console.error('Error explaining violation:', error);
    return violation.suggestion || 'Unable to generate explanation';
  }
}

/**
 * Health check for Gemini API
 * @returns {boolean} True if API is accessible
 */
async function healthCheck() {
  try {
    if (!genAI || !GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return false;
    }
    // Just check if API key exists for now - actual API validation happens during real usage
    return true;
  } catch (error) {
    console.error('Gemini API health check failed:', error.message);
    return false;
  }
}

module.exports = {
  analyzeCompliance,
  generateTestCases,
  explainViolation,
  healthCheck
};
