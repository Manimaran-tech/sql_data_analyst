import subprocess
import time
import os
import sys

def main():
    print("Starting OpenEnv Environment Server...")
    # Set UTF-8 encoding for python outputs
    os.environ["PYTHONIOENCODING"] = "utf-8"
    
    # Start uvicorn server on port 8001
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "server.app:app", "--port", "8001"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait for server to boot
    time.sleep(3)
    
    print("Running Local Test Suite...")
    try:
        # Run test_local.py
        result = subprocess.run(
            [sys.executable, "test_local.py"],
            capture_output=False,
            text=True,
            env=os.environ
        )
        print(f"Test Suite completed with exit code: {result.returncode}")
    finally:
        print("Shutting down Environment Server...")
        server_process.terminate()
        server_process.wait()
        print("Done.")

if __name__ == "__main__":
    main()
