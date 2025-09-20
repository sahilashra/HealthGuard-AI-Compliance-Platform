
import os
from dotenv import load_dotenv

# Construct the absolute path to the .env file
# This makes the script runnable from any directory
script_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(script_dir, '.env')

print(f"Loading environment variables from: {dotenv_path}")
load_dotenv(dotenv_path=dotenv_path, override=True)

# Forcing the GOOGLE_APPLICATION_CREDENTIALS for troubleshooting
key_path_relative = os.getenv("GCP_SERVICE_ACCOUNT_KEY_PATH")
if key_path_relative:
    key_path_absolute = os.path.join(script_dir, key_path_relative)
    print(f"Setting GOOGLE_APPLICATION_CREDENTIALS to: {key_path_absolute}")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path_absolute
else:
    print("GCP_SERVICE_ACCOUNT_KEY_PATH not found in environment.")


# Now, import and run the original script's main function
# We need to add the backend/src directory to the python path to allow the import
import sys
backend_src_path = os.path.join(script_dir, 'backend', 'src')
sys.path.insert(0, backend_src_path)

print("Attempting to run setup_day1.main()...")
try:
    from setup_day1 import main
    main()
    print("setup_day1.main() finished.")
except ImportError:
    print("Error: Could not import 'main' from 'setup_day1'. Check the path and module name.")
except Exception as e:
    print(f"An error occurred while running the setup script: {e}")

