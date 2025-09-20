# python-processor/main.py
import os
import json
import tempfile
from google.cloud import storage
from src.main_pipeline import RAGPipeline

def process_document(event, context):
    """
    Cloud Function triggered by a file upload to a GCS bucket.
    """
    bucket_name = event['bucket']
    file_name = event['name']
    gcs_uri = f"gs://{bucket_name}/{file_name}"

    print(f"Processing file: {gcs_uri}")

    try:
        # Run the existing RAG pipeline
        pipeline = RAGPipeline()
        results = pipeline.run_pipeline(gcs_uri)

        # Save the results to a temporary file
        _, temp_local_path = tempfile.mkstemp()
        with open(temp_local_path, 'w') as f:
            json.dump(results, f)

        # Upload the results back to GCS where the Node.js function can find it
        results_blob_name = f"results_{file_name}.json"
        storage_client = storage.Client()
        results_bucket = storage_client.bucket(os.environ.get('RESULTS_BUCKET'))
        blob = results_bucket.blob(results_blob_name)
        blob.upload_from_filename(temp_local_path)

        print(f"Successfully processed and uploaded results to gs://{results_bucket.name}/{results_blob_name}")

    except Exception as e:
        print(f"Error processing document: {e}")
        # In a real app, you'd want more robust error handling, like sending a failure notification.
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_local_path):
            os.remove(temp_local_path)
