import uvicorn
import os
import sys

# Ensure app can be imported
sys.path.append(os.getcwd())

if __name__ == "__main__":
    print("Starting Uvicorn Server...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["app"])
