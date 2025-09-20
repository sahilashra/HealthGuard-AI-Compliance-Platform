# backend/src/config.py
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_project_root() -> str:
    """Finds the project root by looking for the .git directory."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    while current_dir != os.path.dirname(current_dir):  # Stop at the filesystem root
        if os.path.isdir(os.path.join(current_dir, '.git')):
            return current_dir
        current_dir = os.path.dirname(current_dir)
    raise FileNotFoundError("Project root (.git directory) not found.")

try:
    PROJECT_ROOT = get_project_root()
    DOTENV_PATH = os.path.join(PROJECT_ROOT, '.env')

    if not os.path.exists(DOTENV_PATH):
        raise FileNotFoundError(f".env file not found at {DOTENV_PATH}")

    load_dotenv(dotenv_path=DOTENV_PATH, override=True)
    logging.info(f"Successfully loaded .env file from {DOTENV_PATH}")

except FileNotFoundError as e:
    logging.error(f"Configuration Error: {e}")
    # You might want to exit or handle this more gracefully depending on your application's needs
    # For the hackathon, we'll log the error and let the individual modules fail if the var is missing.

# --- GCP Settings ---
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCP_REGION = os.getenv("GCP_REGION")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
GCP_SERVICE_ACCOUNT_KEY_PATH = os.getenv("GCP_SERVICE_ACCOUNT_KEY_PATH") # Added this line
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Day 1 Settings ---
PROCESSOR_DISPLAY_NAME = os.getenv("PROCESSOR_DISPLAY_NAME")
PROCESSOR_TYPE = os.getenv("PROCESSOR_TYPE")
BUCKET_PREFIX = os.getenv("BUCKET_PREFIX")
SAMPLE_DOC_PATH = os.getenv("SAMPLE_DOC_PATH")

# --- Day 2 Settings ---
DATA_STORE_DISPLAY_NAME = os.getenv("DATA_STORE_DISPLAY_NAME")
ENGINE_DISPLAY_NAME = os.getenv("ENGINE_DISPLAY_NAME")

# --- Validation ---
REQUIRED_VARS = [
    "GCP_PROJECT_ID", "GCP_REGION", "GOOGLE_APPLICATION_CREDENTIALS", "GEMINI_API_KEY",
    "BUCKET_PREFIX", "GCP_SERVICE_ACCOUNT_KEY_PATH" # Added to validation
]
missing_vars = [var for var in REQUIRED_VARS if not globals().get(var)]
if missing_vars:
    error_message = f"CRITICAL CONFIG ERROR: Missing required environment variables: {', '.join(missing_vars)}"
    logging.error(error_message)
    raise ValueError(error_message)

logging.info("Configuration loaded and validated successfully.")
