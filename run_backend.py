import sys
import os

# Add root directory to python path
root_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, root_dir)

from backend.app import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)
