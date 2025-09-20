# -*- coding: utf-8 -*-
"""
Day 1 Setup Script for the Healthcare QA Hackathon.

This script automates the provisioning of essential Google Cloud resources,
including a Document AI processor and Cloud Storage buckets. It also processes
a sample document to demonstrate the initial data extraction pipeline.

Author: Gemini
Date: 2025-09-02
"""

import logging
import os
from typing import Optional

from google.api_core.client_options import ClientOptions
from google.cloud import documentai, storage

# Use the centralized configuration
from config import (
    GCP_PROJECT_ID,
    GCP_REGION,
    GCP_SERVICE_ACCOUNT_KEY_PATH,
    PROCESSOR_DISPLAY_NAME,
    PROCESSOR_TYPE,
    BUCKET_PREFIX
)


class HealthcareQASetup:
    """
    A class to set up the Document AI and GCS resources.
    """

    def __init__(self):
        """
        Initializes the setup class, loading configuration and setting up clients.
        """
        self.gcp_project_id: str = GCP_PROJECT_ID
        self.gcp_region: str = GCP_REGION
        self.gcp_service_account_key_path: str = GCP_SERVICE_ACCOUNT_KEY_PATH
        self.processor_display_name: str = PROCESSOR_DISPLAY_NAME
        self.processor_type: str = PROCESSOR_TYPE
        self.bucket_prefix: str = BUCKET_PREFIX
        self.raw_bucket_name: str = f"{self.bucket_prefix}-raw-documents"
        self.processed_bucket_name: str = f"{self.bucket_prefix}-processed-documents"

        # Redundant validation removed. Central validation is in config.py

        self.docai_client = documentai.DocumentProcessorServiceClient(
            client_options=ClientOptions(api_endpoint=f"{self.gcp_region}-documentai.googleapis.com")
        )
        self.storage_client = storage.Client()

        self.processor_name: str = ""
        self.bucket_names = {
            "raw": f"{self.bucket_prefix}-raw-documents",
            "processed": f"{self.bucket_prefix}-processed-json",
            "structured": f"{self.bucket_prefix}-structured-data",
            "unstructured": f"{self.bucket_prefix}-unstructured-data",
            "error": f"{self.bucket_prefix}-error-logs",
            "temp": f"{self.bucket_prefix}-temp-staging",
        }

    

    def get_or_create_processor(self) -> str:
        """
        Checks for an existing Document AI processor or creates a new one.

        Returns:
            The full resource name of the processor.
        """
        parent = f"projects/{self.gcp_project_id}/locations/{self.gcp_region}"
        logging.info(f"Checking for Document AI processor in {parent}...")

        try:
            # Check if processor already exists
            for processor in self.docai_client.list_processors(parent=parent):
                if processor.display_name == self.processor_display_name:
                    logging.info(f"Found existing processor: {processor.name}")
                    self.processor_name = processor.name
                    return self.processor_name

            # Create a new processor if not found
            logging.info(f"No existing processor found. Creating a new one...")
            processor = self.docai_client.create_processor(
                parent=parent,
                processor=documentai.Processor(
                    display_name=self.processor_display_name,
                    type_=self.processor_type
                )
            )
            logging.info(f"Successfully created processor: {processor.name}")
            self.processor_name = processor.name
            return self.processor_name

        except exceptions.GoogleAPICallError as e:
            logging.error(f"API error during processor setup: {e}")
            raise

    def grant_permissions(self, bucket_name: str):
        """
        Grants the service account the Storage Object Admin role for a given bucket.
        """
        try:
            with open(self.service_account_path, "r") as f:
                service_account_info = json.load(f)
            service_account = service_account_info["client_email"]
            
            bucket = self.storage_client.get_bucket(bucket_name)
            from google.cloud.storage import iam
            policy = bucket.get_iam_policy(requested_policy_version=3)
            policy.bindings.append(
                {"role": "roles/storage.objectAdmin", "members": {f"serviceAccount:{service_account}"}}
            )
            bucket.set_iam_policy(policy)
            logging.info(f"Granted Storage Object Admin role to service account for bucket gs://{bucket_name}")
        except exceptions.GoogleAPICallError as e:
            logging.error(f"Failed to grant permissions for bucket gs://{bucket_name}: {e}")
            raise

    def create_gcs_buckets(self):
        """
        Creates the 5 required GCS buckets with uniform bucket-level access.
        """
        logging.info("Setting up Cloud Storage buckets...")
        for bucket_name in self.bucket_names.values():
            try:
                bucket = self.storage_client.create_bucket(bucket_name, location=self.gcp_region)
                bucket.iam_configuration.uniform_bucket_level_access_enabled = True
                bucket.patch()
                logging.info(f"Successfully created bucket: gs://{bucket_name}")
            except exceptions.Conflict:
                logging.warning(f"Bucket gs://{bucket_name} already exists. Skipping creation.")
            except exceptions.GoogleAPICallError as e:
                logging.error(f"Failed to create bucket gs://{bucket_name}: {e}")
                raise
            
            self.grant_permissions(bucket_name)

    def process_sample_document(self):
        """
        Uploads, processes, and structures the sample healthcare document.
        """
        if not self.processor_name:
            raise ValueError("Processor has not been created or identified.")
        
        if not os.path.exists(self.sample_doc_path):
            raise FileNotFoundError(f"Sample document not found at: {self.sample_doc_path}")

        # 1. Upload to GCS
        logging.info(f"Uploading sample document '{self.sample_doc_path}' to GCS...")
        raw_bucket = self.storage_client.get_bucket(self.bucket_names["raw"])
        blob_name = os.path.basename(self.sample_doc_path)
        blob = raw_bucket.blob(blob_name)
        
        try:
            blob.upload_from_filename(self.sample_doc_path)
            logging.info(f"Successfully uploaded to gs://{self.bucket_names['raw']}/{blob_name}")
        except Exception as e:
            logging.error(f"Failed to upload sample document: {e}")
            raise

        # 2. Process with Document AI using gs:// URI
        gcs_uri = f"gs://{self.bucket_names['raw']}/{blob_name}"
        logging.info(f"Processing document with Document AI processor...")
        
        # Determine MIME type from file extension
        mime_type = "application/pdf" if self.sample_doc_path.lower().endswith('.pdf') else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        request = documentai.ProcessRequest(
            name=self.processor_name,
            gcs_document=documentai.GcsDocument(
                gcs_uri=gcs_uri,
                mime_type=mime_type,
            ),
        )

        try:
            result = self.docai_client.process_document(request=request)
            document = result.document
            logging.info("Document processed successfully.")
            
            # 3. Save raw JSON output
            processed_bucket = self.storage_client.get_bucket(self.bucket_names["processed"])
            json_blob_name = f"{os.path.splitext(blob_name)[0]}.json"
            json_blob = processed_bucket.blob(json_blob_name)
            json_blob.upload_from_string(
                documentai.Document.to_json(document),
                content_type="application/json"
            )
            logging.info(f"Saved raw Document AI JSON output to gs://{self.bucket_names['processed']}/{json_blob_name}")

            # 4. Parse and structure the data
            self._parse_and_structure_document(document, blob_name)

        except exceptions.GoogleAPICallError as e:
            logging.error(f"Error processing document with Document AI: {e}")
            # Optional: Move failed document to error bucket
            error_bucket = self.storage_client.get_bucket(self.bucket_names["error"])
            raw_bucket.copy_blob(blob, error_bucket, f"failed-{blob_name}")
            blob.delete()
            logging.warning(f"Moved failed document to gs://{self.bucket_names['error']}/failed-{blob_name}")
            raise

    def _parse_and_structure_document(self, document: documentai.Document, original_filename: str):
        """
        Parses the form fields from the processed document and saves structured data.
        
        Args:
            document: The processed Document AI document object.
            original_filename: The name of the original file processed.
        """
        logging.info("Parsing and structuring extracted data...")
        
        # This parsing logic is specific to the FORM_PARSER and the sample document.
        # It will need to be adapted for different document types or a custom processor.
        extracted_requirements = []
        current_requirement = {}

        for page in document.pages:
            for field in page.form_fields:
                field_name = self._get_text(field.field_name, document).strip().replace(':', '')
                field_value = self._get_text(field.field_value, document).strip()

                if "Requirement ID" in field_name:
                    if current_requirement:
                        extracted_requirements.append(current_requirement)
                    current_requirement = {"Requirement ID": field_value}
                elif current_requirement:
                    current_requirement[field_name] = field_value
        
        if current_requirement:
            extracted_requirements.append(current_requirement)

        logging.info(f"Extracted {len(extracted_requirements)} requirements.")

        # Save structured data to GCS
        structured_bucket = self.storage_client.get_bucket(self.bucket_names["structured"])
        structured_blob_name = f"{os.path.splitext(original_filename)[0]}-structured.json"
        structured_blob = structured_bucket.blob(structured_blob_name)
        structured_blob.upload_from_string(
            json.dumps(extracted_requirements, indent=2),
            content_type="application/json"
        )
        logging.info(f"Saved structured data to gs://{self.bucket_names['structured']}/{structured_blob_name}")

    @staticmethod
    def _get_text(el: documentai.Document.Page.Layout, doc: documentai.Document) -> str:
        """
        Extracts text from a Document AI text anchor.
        """
        response = ""
        for segment in el.text_anchor.text_segments:
            start_index = int(segment.start_index)
            end_index = int(segment.end_index)
            response += doc.text[start_index:end_index]
        return response

    def run_setup(self):
        """
        Executes the full Day 1 setup process step-by-step.
        """
        logging.info("--- Starting Healthcare QA Hackathon Day 1 Setup ---")
        try:
            self.get_or_create_processor()
            self.create_gcs_buckets()
            self.process_sample_document()
            logging.info("--- Day 1 Setup Completed Successfully! ---")
            logging.info("Your Google Cloud environment is ready for Day 2.")
        except Exception as e:
            logging.error(f"--- Day 1 Setup Failed: {e} ---")
            logging.error("Please check the logs and your configuration, then try again.")


def main():
    """
    Main function to run the setup script.
    """
    try:
        setup = HealthcareQASetup()
        setup.run_setup()
    except (ValueError, FileNotFoundError) as e:
        logging.error(f"Configuration Error: {e}")
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()
