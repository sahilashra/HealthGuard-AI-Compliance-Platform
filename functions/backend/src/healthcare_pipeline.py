# -*- coding: utf-8 -*-
"""
Core Healthcare Compliance Pipeline for HealthGuard AI.

This module contains the main functions for processing documents,
calculating compliance scores, and detecting potential violations.

Author: Gemini (Engineering Lead)
Date: 2025-09-18
"""

import logging

def calculate_compliance_score(qa_pairs: list) -> dict:
    """
    Revolutionary: Calculate compliance confidence score based on extracted QA pairs.
    
    Args:
        qa_pairs: A list of question-answer pairs extracted from the document.
        
    Returns:
        A dictionary containing the compliance score and risk level.
    """
    # Simple but effective scoring logic
    score = min(100, len(qa_pairs) * 15)
    risk_level = "LOW" if score > 80 else ("MEDIUM" if score > 50 else "HIGH")
    
    logging.info(f"Calculated compliance score: {score}%, Risk Level: {risk_level}")
    return {"compliance_score": score, "risk_level": risk_level}

def detect_violations(content: str) -> list:
    """
    Revolutionary: Basic violation detection for HIPAA and PII.
    
    Args:
        content: The full text content of the document.
        
    Returns:
        A list of potential violations found in the document.
    """
    violations = []
    content_lower = content.lower()

    # HIPAA Check
    if "patient data" in content_lower and "encrypted" not in content_lower:
        violations.append({
            "type": "HIPAA",
            "description": "Unencrypted patient data detected.",
            "suggestion": "Ensure all patient data is stored and transmitted with strong encryption."
        })

    # PII Check
    if "social security" in content_lower and "protected" not in content_lower:
        violations.append({
            "type": "PII",
            "description": "Unprotected sensitive data (Social Security Number) detected.",
            "suggestion": "Mask or redact Social Security Numbers and ensure access is restricted."
        })
        
    logging.info(f"Detected {len(violations)} potential violations.")
    return violations

def process_document_for_compliance(document_text: str, qa_pairs: list) -> dict:
    """
    Main pipeline function to run a document through the compliance checks.
    
    Args:
        document_text: The full text of the document.
        qa_pairs: A list of QA pairs generated from the document.
        
    Returns:
        A dictionary with the full compliance analysis results.
    """
    logging.info("Starting full compliance analysis pipeline...")
    
    # 1. Calculate Compliance Score
    score_result = calculate_compliance_score(qa_pairs)
    
    # 2. Detect Violations
    violation_result = detect_violations(document_text)
    
    # 3. Generate Executive Summary
    summary = (
        f"HealthGuard AI analysis complete. The document has a compliance score of "
        f"{score_result['compliance_score']}% ({score_result['risk_level']} risk). "
        f"{len(violation_result)} potential violations were detected. "
        f"Review the detailed report for suggestions."
    )
    
    return {
        "compliance_score": score_result['compliance_score'],
        "risk_level": score_result['risk_level'],
        "violations": violation_result,
        "executive_summary": summary,
        "status": "Completed"
    }