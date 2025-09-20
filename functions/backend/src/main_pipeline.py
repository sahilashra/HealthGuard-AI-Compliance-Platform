# -*- coding: utf-8 -*-
"""
Main RAG Pipeline for the Healthcare QA Hackathon.

This script orchestrates the end-to-end RAG pipeline, connecting
document processing, compliance search, and test case generation.

Author: Gemini
Date: 2025-09-03
"""

import logging
import os
import json
import sys
import tempfile
import uuid # <-- Add this import
from typing import List, Dict, Any

from pypdf import PdfReader
from google.cloud import storage  # <-- I am adding this line back

# Use the centralized configuration and logging
from config import logging, SAMPLE_DOC_PATH
from setup_day1 import HealthcareQASetup
from setup_day2 import VertexAISearchSetup
from gemini_integration import GeminiIntegration
from healthcare_pipeline import process_document_for_compliance


class RAGPipeline:
    """
    A class to orchestrate the RAG pipeline.
    """

    def __init__(self):
        """
        Initializes the RAG pipeline, setting up clients.
        """
        self.day1_setup = HealthcareQASetup()
        self.day2_setup = VertexAISearchSetup()
        self.gemini = GeminiIntegration()

    def run_pipeline(self, gcs_uri: str) -> List[Dict[str, Any]]:
        """
        Runs the end-to-end RAG pipeline.

        Args:
            gcs_uri: The GCS URI of the document to process.

        Returns:
            A list of dictionaries, where each dictionary represents a test case.
        """
        logging.info("--- Starting RAG Pipeline ---")
        document_path = None  # Initialize to ensure it exists in the finally block

        try:
            # 1. Download the document from GCS and read the text
            logging.info(f"Downloading document from: {gcs_uri}")
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.basename(gcs_uri)) as temp_file:
                storage_client = storage.Client()
                if not gcs_uri.startswith("gs://"):
                    raise ValueError("Invalid GCS URI. Must start with 'gs://'")
                bucket_name, blob_name = gcs_uri[5:].split("/", 1)
                bucket = storage_client.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                blob.download_to_filename(temp_file.name)
                document_path = temp_file.name

            logging.info(f"Reading text from temporary file: {document_path}")
            document_text = ""
            if document_path.lower().endswith(".pdf"):
                reader = PdfReader(document_path)
                for page in reader.pages:
                    document_text += page.extract_text() or ""
            elif document_path.lower().endswith((".txt", ".md")):
                with open(document_path, 'r', encoding='utf-8') as f:
                    document_text = f.read()
            else:
                raise ValueError(f"Unsupported file type: {document_path}")

        except Exception as e:
            logging.error(f"Failed to download or read document: {e}", exc_info=True)
            raise
        finally:
            if document_path and os.path.exists(document_path):
                os.remove(document_path)

        # 2. Parse the requirements from the document text
        requirements = self.gemini.parse_requirements(document_text)

        # 3. For each requirement, find relevant compliance information and generate test cases
        all_test_cases = []
        for req in requirements:
            logging.info(f"Processing requirement: {req.get('requirement_id')}")
            query = f"{req.get('title')} {req.get('description')}"
            compliance_context = self.day2_setup.search_compliance_knowledge_base(query)
            
            test_cases = self.gemini.generate_test_cases_with_compliance(req, compliance_context)
            all_test_cases.extend(test_cases)

        # 4. Now, run compliance analysis with the generated test cases
        logging.info("Running final compliance analysis with generated test cases...")
        compliance_results = process_document_for_compliance(document_text, all_test_cases)

        logging.info("--- RAG Pipeline Completed Successfully! ---")
        
        # 5. Combine results into the final output structure
        final_output = {
            "compliance_analysis": compliance_results,
            "generated_test_cases": all_test_cases
        }
        
        return final_output


def main():
    """
    Main function to run the RAG pipeline.
    """
    try:
        if len(sys.argv) < 2:
            logging.error("Usage: python main_pipeline.py <gcs_uri>")
            sys.exit(1)
        
        gcs_uri = sys.argv[1]
        pipeline = RAGPipeline()
        results = pipeline.run_pipeline(gcs_uri)
        
        # In a Cloud Function environment, only the /tmp directory is writable.
        # We create a unique filename to avoid conflicts between invocations.
        output_filename = os.path.join("/tmp", f"results_{uuid.uuid4()}.json")
        
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
            
        # IMPORTANT: Print the filename to stdout so the Node.js server knows where to find it.
        print(f"SUCCESS:{output_filename}")
            
        logging.info(f"Pipeline finished. Results saved to '{output_filename}'.")

    except Exception as e:
        import traceback
        print(f"PYTHON SCRIPT ERROR: An unexpected error occurred: {e}", file=sys.stdout)
        traceback.print_exc(file=sys.stdout)
        sys.exit(1)


    except (ValueError, FileNotFoundError) as e:
        logging.error(f"Configuration Error: {e}")
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()
