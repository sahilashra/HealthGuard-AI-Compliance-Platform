// services/complianceKnowledge.js
// Compliance knowledge base for healthcare regulations

const COMPLIANCE_KNOWLEDGE_BASE = `
HEALTHCARE COMPLIANCE REGULATIONS KNOWLEDGE BASE
================================================

1. HIPAA (Health Insurance Portability and Accountability Act)
----------------------------------------------------------------

§164.312(a)(1) - Access Control
- Requirement: Implement technical policies and procedures to allow only authorized persons to access ePHI
- Key Points:
  * Unique user identification required
  * Emergency access procedures must exist
  * Automatic logoff after period of inactivity
  * Encryption and decryption capabilities

§164.312(a)(2)(i) - Unique User Identification
- Requirement: Assign a unique name and/or number for identifying and tracking user identity
- Key Points:
  * Each user must have unique credentials
  * No shared accounts for ePHI access
  * User actions must be traceable

§164.312(b) - Audit Controls
- Requirement: Implement hardware, software, and/or procedural mechanisms to record and examine ePHI access and activity
- Key Points:
  * Log all access to ePHI
  * Regular audit log reviews
  * Protect audit logs from tampering
  * Retain logs for minimum 6 years

§164.312(c)(1) - Integrity Controls
- Requirement: Implement policies and procedures to protect ePHI from improper alteration or destruction
- Key Points:
  * Implement checksums or hash functions
  * Digital signatures for critical data
  * Version control for documents
  * Backup and recovery procedures

§164.312(d) - Person or Entity Authentication
- Requirement: Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed
- Key Points:
  * Multi-factor authentication recommended
  * Strong password requirements
  * Regular credential updates
  * Account lockout after failed attempts

§164.312(e)(1) - Transmission Security
- Requirement: Implement technical security measures to guard against unauthorized access to ePHI transmitted over electronic networks
- Key Points:
  * Use TLS/SSL for data in transit
  * VPN for remote access
  * Secure email (encrypted)
  * Protected wireless networks

2. FDA 21 CFR Part 11 (Electronic Records and Signatures)
---------------------------------------------------------

§11.10(a) - System Validation
- Requirement: Validation of systems to ensure accuracy, reliability, consistent intended performance, and ability to discern invalid or altered records
- Key Points:
  * Documented validation protocols
  * Installation Qualification (IQ)
  * Operational Qualification (OQ)
  * Performance Qualification (PQ)
  * Periodic revalidation

§11.10(b) - Ability to Generate Copies
- Requirement: System must be able to generate accurate and complete copies of records in human-readable and electronic form
- Key Points:
  * Export functionality required
  * Both readable and machine-readable formats
  * Complete audit trail included in copies
  * Retention period compliance

§11.10(c) - Protection of Records
- Requirement: Records must be protected to enable accurate and ready retrieval throughout retention period
- Key Points:
  * Backup and recovery systems
  * Disaster recovery plans
  * Data archival procedures
  * Protection from loss or damage

§11.10(d) - Audit Trails
- Requirement: System must generate time-stamped audit trails to record date and time of operator entries and actions
- Key Points:
  * Who, what, when, where logging
  * Independent and computer-generated
  * Immutable audit trail
  * Includes original and modified values

§11.10(e) - Operational System Checks
- Requirement: Use of operational system checks to enforce permitted sequencing of steps and events
- Key Points:
  * Workflow controls
  * Mandatory field validation
  * Process step verification
  * Prevention of unauthorized deviations

§11.10(g) - Authority Checks
- Requirement: Determination that persons who develop, maintain, or use electronic record/signature systems have authority and assigned responsibilities
- Key Points:
  * Role-based access control
  * Documented user roles
  * Regular review of permissions
  * Separation of duties

§11.50 - Signature Manifestations
- Requirement: Signed electronic records must contain information associated with the signing
- Key Points:
  * Printed name of signer
  * Date and time of signature
  * Meaning of signature (e.g., review, approval)
  * Cryptographically bound to record

§11.70 - Electronic Signature Components
- Requirement: Electronic signatures must use at least two distinct identification components
- Key Points:
  * Multi-factor authentication
  * Unique to one individual
  * Not reused or reassigned
  * Device-specific tokens when appropriate

3. ISO 13485:2016 (Medical Devices - Quality Management Systems)
----------------------------------------------------------------

§7.3.2 - Design and Development Planning
- Requirement: Organization must plan and control design and development of medical devices
- Key Points:
  * Design stages and phases documented
  * Review, verification, validation at each stage
  * Responsibilities and authorities defined
  * Traceability of design outputs to inputs

§7.3.3 - Design and Development Inputs
- Requirement: Requirements relating to the medical device must be determined and records maintained
- Key Points:
  * Functional and performance requirements
  * Applicable regulatory requirements
  * Risk management requirements
  * User interface and usability requirements

§7.3.4 - Design and Development Outputs
- Requirement: Outputs of design and development must be provided in form suitable for verification
- Key Points:
  * Meet input requirements
  * Provide information for purchasing, production
  * Contain or reference acceptance criteria
  * Specify characteristics essential for safe use

§7.3.5 - Design and Development Review
- Requirement: Systematic reviews must be conducted at suitable stages
- Key Points:
  * Evaluate ability to meet requirements
  * Identify problems and propose actions
  * Participants include representatives from functions concerned
  * Records of reviews maintained

§7.3.6 - Design and Development Verification
- Requirement: Verification must be performed to ensure design outputs meet input requirements
- Key Points:
  * Test methods documented
  * Acceptance criteria defined
  * Results recorded
  * Alternative calculations or comparisons when testing not feasible

§7.3.7 - Design and Development Validation
- Requirement: Validation must be performed to ensure device meets specified requirements for intended use
- Key Points:
  * Clinical evaluation per regulatory requirements
  * Validation completed before delivery
  * Results recorded
  * Multiple validations if multiple intended uses

§7.5.1 - Control of Production and Service Provision
- Requirement: Organization must plan and carry out production under controlled conditions
- Key Points:
  * Documented procedures and instructions
  * Qualified equipment and personnel
  * Monitoring and measurement procedures
  * Release, delivery, post-delivery activities

§7.5.3 - Traceability
- Requirement: Organization must document traceability requirements and maintain records
- Key Points:
  * Unique device identification
  * Component and material traceability
  * Work environment conditions recorded
  * Distribution records maintained

4. IEC 62304 (Medical Device Software - Software Life Cycle Processes)
----------------------------------------------------------------------

§5.2 - Software Requirements Analysis
- Requirement: Transform regulatory and system requirements into set of software requirements
- Key Points:
  * Define and document software requirements
  * Ensure completeness and consistency
  * Verify requirements are traceable
  * Re-evaluate when system requirements change

§5.5 - Software Unit Implementation and Verification
- Requirement: Implement and verify each software unit
- Key Points:
  * Unit implementation consistent with design
  * Unit testing procedures established
  * Unit acceptance criteria defined
  * Unit verification results documented

§5.6 - Software Integration and Integration Testing
- Requirement: Integrate software units and test integrated software
- Key Points:
  * Integration plan documented
  * Integration tests defined
  * Test procedures and results recorded
  * Regression testing performed

§5.7 - Software System Testing
- Requirement: Conduct software system testing using software requirements specification
- Key Points:
  * Verify all requirements implemented
  * Test in representative environment
  * Document anomalies
  * Retest after anomaly fixes

§6.1 - Maintenance Plan
- Requirement: Establish software maintenance plan
- Key Points:
  * Feedback collection and evaluation
  * Problem resolution procedures
  * Update delivery procedures
  * Retirement procedures

§8.1 - Software Risk Management Process
- Requirement: Establish, document, and maintain risk management activities
- Key Points:
  * Risk analysis of software items
  * Risk control measures implementation
  * Risk management plan
  * Risk management review

5. COMMON VIOLATIONS AND TEST CASE FOCUS AREAS
----------------------------------------------

High-Risk Areas Requiring Extensive Testing:

A. Data Security and Privacy
- Missing encryption at rest and in transit
- Inadequate access controls
- No audit logging or incomplete logs
- Insufficient authentication mechanisms
- Lack of data backup and recovery procedures

B. Software Validation and Verification
- Incomplete traceability matrix
- Missing test cases for critical requirements
- No regression testing procedures
- Inadequate user acceptance testing
- Missing validation documentation

C. Audit Trail and Change Control
- No audit trail or incomplete logging
- Lack of change control procedures
- Missing version control
- Inadequate documentation of changes
- No review and approval workflows

D. User Authentication and Authorization
- Weak password policies
- No multi-factor authentication
- Shared user accounts
- Inadequate role-based access control
- Missing session timeout controls

E. Data Integrity and Quality
- No data validation checks
- Missing error handling procedures
- Inadequate backup procedures
- No data integrity verification
- Missing data retention policies

F. Documentation and Traceability
- Incomplete design documentation
- Missing requirements traceability
- Inadequate test documentation
- No change history records
- Missing user manuals or SOPs

6. TEST CASE GENERATION GUIDELINES
----------------------------------

For Each Requirement, Generate Test Cases That Verify:

1. Functional Compliance
   - Feature works as specified
   - All acceptance criteria met
   - Edge cases handled
   - Error conditions managed

2. Regulatory Compliance
   - Specific regulation requirements met
   - Documentation requirements satisfied
   - Traceability established
   - Validation evidence provided

3. Security Compliance
   - Access controls enforced
   - Data protection implemented
   - Audit logging functional
   - Authentication verified

4. Data Integrity
   - Data validation working
   - Backup/recovery functional
   - Version control maintained
   - Change tracking operational

5. Usability and Safety
   - User interface clear and intuitive
   - Error messages helpful
   - Help documentation available
   - Safety warnings displayed

Test Case Quality Standards:
- Each test case must reference specific regulation sections
- Test steps must be detailed and reproducible
- Expected results must be clear and measurable
- Test data requirements must be specified
- Pass/fail criteria must be objective
`;

/**
 * Get the complete compliance knowledge base
 * @returns {string} The compliance knowledge base text
 */
function getComplianceKnowledgeBase() {
  return COMPLIANCE_KNOWLEDGE_BASE;
}

/**
 * Get relevant compliance context for a specific requirement
 * @param {string} requirementText - The requirement text to analyze
 * @returns {string} Relevant compliance information
 */
function getRelevantComplianceContext(requirementText) {
  // For now, return the full knowledge base
  // In a production system, this could use embeddings/vector search to find most relevant sections
  return COMPLIANCE_KNOWLEDGE_BASE;
}

/**
 * Determine risk level based on compliance violations
 * @param {Array} violations - Array of compliance violations
 * @returns {string} Risk level: LOW, MEDIUM, or HIGH
 */
function determineRiskLevel(violations) {
  if (!violations || violations.length === 0) {
    return 'LOW';
  }

  // High-risk indicators
  const highRiskKeywords = [
    'encryption', 'phi', 'patient data', 'protected health',
    'audit trail', 'fda class iii', 'life-sustaining', 'critical',
    'authentication', 'access control', 'data breach'
  ];

  const hasHighRiskViolation = violations.some(violation => {
    const violationText = `${violation.type} ${violation.description}`.toLowerCase();
    return highRiskKeywords.some(keyword => violationText.includes(keyword));
  });

  if (hasHighRiskViolation || violations.length > 10) {
    return 'HIGH';
  } else if (violations.length > 5) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

module.exports = {
  getComplianceKnowledgeBase,
  getRelevantComplianceContext,
  determineRiskLevel,
  COMPLIANCE_KNOWLEDGE_BASE
};
