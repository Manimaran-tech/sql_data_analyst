import os
import shutil
import uuid
import json
import time
import base64
import hashlib
import hmac
import keyring  # type: ignore

# ----- Keyring Headless Fallback -----
class MemoryKeyring:
    """A thread-safe, in-memory keyring fallback for headless environments."""
    def __init__(self):
        self._store = {}
        import threading
        self._lock = threading.Lock()

    def get_password(self, service_name: str, username: str) -> str | None:
        with self._lock:
            return self._store.get((service_name, username))

    def set_password(self, service_name: str, username: str, password: str):
        with self._lock:
            self._store[(service_name, username)] = password

    def delete_password(self, service_name: str, username: str):
        with self._lock:
            key = (service_name, username)
            if key in self._store:
                del self._store[key]

# Probe OS Keyring capability at startup.
try:
    keyring.set_password("SwarmAnalyst_TestProbe", "probe_user", "probe_pass")
    retrieved = keyring.get_password("SwarmAnalyst_TestProbe", "probe_user")
    if retrieved != "probe_pass":
        raise Exception("OS Keyring read/write verify mismatch.")
    keyring.delete_password("SwarmAnalyst_TestProbe", "probe_user")
except Exception as e:
    print(f"OS Keyring not available or failed verification ({str(e)}). Falling back to MemoryKeyring.")
    keyring = MemoryKeyring()

from cryptography.fernet import Fernet  # type: ignore
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, List

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.adapters.postgres import PostgresAdapter
from backend.adapters.mongo import MongoAdapter
from backend.adapters.flatfile import FlatFileAdapter
from backend.adapters.firebase import FirebaseAdapter
from backend.agents.llm_client import LLMClient
from backend.agents.swarm import SwarmOrchestrator

app = FastAPI(title="Enterprise SQL Data Analyst Swarm API")

@app.get("/")
@app.head("/")
@app.get("/healthz")
@app.head("/healthz")
async def health_check():
    return {"status": "healthy", "service": "SwarmAnalyst API"}

SERVICE_NAME = "SwarmAnalyst"
KEY_USER = "SwarmAnalystApiKey"
KEY_TIMESTAMP_USER = "SwarmAnalystApiKeyTimestamp"
KEY_TTL_SECONDS = 12 * 60 * 60  # 12 hours

# ----- Encryption Utilities -----
# Derive a machine-specific Fernet key from a stable secret
def _get_encryption_key() -> bytes:
    """Derive a Fernet encryption key from a machine-stable seed."""
    # Use a combination of service name + machine hostname as seed
    seed = f"{SERVICE_NAME}:::{os.environ.get('COMPUTERNAME', 'default')}:::swarm-analyst-v1"
    # SHA-256 hash → base64 URL-safe 32-byte key for Fernet
    raw = hashlib.sha256(seed.encode()).digest()
    return base64.urlsafe_b64encode(raw)

def _encrypt_key(plaintext: str) -> str:
    """Encrypt an API key string using AES-256 (Fernet)."""
    f = Fernet(_get_encryption_key())
    return f.encrypt(plaintext.encode()).decode()

def _decrypt_key(ciphertext: str) -> str:
    """Decrypt an API key string from AES-256 (Fernet)."""
    f = Fernet(_get_encryption_key())
    return f.decrypt(ciphertext.encode()).decode()

def _is_key_expired() -> bool:
    """Check if the stored key has exceeded the 12-hour TTL."""
    try:
        ts_str = keyring.get_password(SERVICE_NAME, KEY_TIMESTAMP_USER)
        if not ts_str:
            return True
        stored_time = float(ts_str)
        return (time.time() - stored_time) > KEY_TTL_SECONDS
    except Exception:
        return True

def _purge_expired_key():
    """Delete key and timestamp from keyring if expired."""
    try:
        keyring.delete_password(SERVICE_NAME, KEY_USER)
    except Exception:
        pass
    try:
        keyring.delete_password(SERVICE_NAME, KEY_TIMESTAMP_USER)
    except Exception:
        pass

def _retrieve_valid_key() -> str | None:
    """Retrieve the decrypted API key if it exists and hasn't expired."""
    if _is_key_expired():
        _purge_expired_key()
        return None
    try:
        encrypted = keyring.get_password(SERVICE_NAME, KEY_USER)
        if not encrypted:
            return None
        return _decrypt_key(encrypted)
    except Exception:
        _purge_expired_key()
        return None

def _mask_key(key: str) -> str:
    """Mask an API key for display: show only last 4 characters."""
    if len(key) <= 4:
        return "****"
    return "•" * (len(key) - 4) + key[-4:]

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads directory as static files server
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Helper to map db_type string to adapter class
def get_adapter(db_type: str):
    if db_type == "postgres":
        return PostgresAdapter()
    elif db_type == "mongodb":
        return MongoAdapter()
    elif db_type == "firebase":
        return FirebaseAdapter()
    elif db_type == "flatfile":
        return FlatFileAdapter()
    else:
        raise ValueError(f"Unknown database type: {db_type}")

class KeySaveRequest(BaseModel):
    api_key: str

@app.get("/api/settings/key")
async def get_api_key():
    """
    Retrieve the API Key status. Returns a masked version for display.
    The raw key is NEVER sent to the frontend via this endpoint.
    """
    try:
        plaintext = _retrieve_valid_key()
        if plaintext:
            # Calculate remaining TTL
            ts_str = keyring.get_password(SERVICE_NAME, KEY_TIMESTAMP_USER)
            remaining = 0
            if ts_str:
                elapsed = time.time() - float(ts_str)
                remaining = max(0, int(KEY_TTL_SECONDS - elapsed))
            return {
                "success": True,
                "api_key": _mask_key(plaintext),
                "has_key": True,
                "expires_in_seconds": remaining,
                "expires_in_hours": round(remaining / 3600, 1)
            }
        else:
            return {"success": True, "api_key": "", "has_key": False, "expires_in_seconds": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve key status: {str(e)}")

@app.post("/api/settings/key")
async def save_api_key(req: KeySaveRequest):
    """
    Encrypt and save the API Key in the OS Keyring with a 12-hour TTL timestamp.
    """
    try:
        encrypted = _encrypt_key(req.api_key)
        keyring.set_password(SERVICE_NAME, KEY_USER, encrypted)
        keyring.set_password(SERVICE_NAME, KEY_TIMESTAMP_USER, str(time.time()))
        return {
            "success": True,
            "message": "API key encrypted (AES-256) and stored securely. It will auto-expire in 12 hours."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save key: {str(e)}")

@app.delete("/api/settings/key")
async def delete_api_key():
    """
    Immediately delete the API Key and its timestamp from the OS Keyring.
    """
    try:
        _purge_expired_key()
        return {"success": True, "message": "API key and timestamp purged from OS keyring."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete key: {str(e)}")

# Connection testing input schema
class ConnectRequest(BaseModel):
    db_type: str
    credentials: Dict[str, Any]

@app.post("/api/connect-test")
async def test_connection(req: ConnectRequest):
    """
    Test connection settings for PostgreSQL, MongoDB, or Firebase.
    """
    try:
        adapter = get_adapter(req.db_type)
        success = await adapter.connect(req.credentials)
        schema = await adapter.get_schema()
        preview_table, preview_records = await adapter.get_preview()
        await adapter.close()
        return {
            "success": success,
            "schema": schema,
            "preview_table_name": preview_table,
            "preview_records": preview_records
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection test failed: {str(e)}")

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload a local CSV or Excel file and save it to the server uploads folder.
    Returns the table name and local file path.
    """
    # Clean filename to create a valid SQL table name
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    base, ext = os.path.splitext(filename)
    table_name = "".join(c if c.isalnum() else "_" for c in base).lower()
    # Handle duplicates by adding a short uuid
    table_name = f"{table_name}_{uuid.uuid4().hex[:4]}"

    file_path = os.path.join(UPLOAD_DIR, f"{table_name}{ext}")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {
            "success": True,
            "table_name": table_name,
            "file_path": file_path,
            "original_filename": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.websocket("/ws/swarm")
async def websocket_swarm_endpoint(websocket: WebSocket):
    await websocket.accept()
    log_callback_active = True
    
    # Callback to send thoughts back to client
    async def send_log(agent: str, message: str):
        if log_callback_active:
            try:
                await websocket.send_json({
                    "type": "log",
                    "agent": agent,
                    "message": message
                })
            except Exception:
                pass

    try:
        # 1. Receive initial configuration
        data = await websocket.receive_text()
        config = json.loads(data)
        
        api_key = config.get("api_key")
        db_type = config.get("db_type")
        credentials = config.get("credentials", {})
        question = config.get("question")
        chat_history = config.get("chat_history", [])
        
        if not api_key:
            # Fallback to check keyring (decrypted)
            try:
                api_key = _retrieve_valid_key()
            except Exception:
                pass
                
        if not api_key:
            await websocket.send_json({"type": "error", "message": "NVIDIA NIM API Key is required."})
            await websocket.close()
            return
            
        if not question:
            await websocket.send_json({"type": "error", "message": "User query/question is required."})
            await websocket.close()
            return

        # 2. Instantiate and connect DB Adapter
        await send_log("System", f"Connecting to {db_type} database...")
        adapter = get_adapter(db_type)
        
        try:
            await adapter.connect(credentials)
            await send_log("System", "✅ Connection successful!")
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Connection failed: {str(e)}"})
            await websocket.close()
            return

        # 3. Instantiate NIM client & Swarm Orchestrator
        try:
            model = config.get("model")
            llm_provider = config.get("llm_provider", "nvidia")
            api_base_url = config.get("api_base_url", "")
            
            client_kwargs = {"api_key": api_key, "provider": llm_provider}
            if model:
                client_kwargs["default_model"] = model
            if api_base_url and api_base_url.strip():
                client_kwargs["api_base"] = api_base_url.strip()
            
            llm_client = LLMClient(**client_kwargs)
            orchestrator = SwarmOrchestrator(llm_client)
            
            # Helper function mapper
            def sync_log_callback(agent: str, message: str):
                import asyncio
                # Schedule the async WebSocket send from a sync thread/callback context
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                loop.create_task(send_log(agent, message))

            # Run investigation
            result = await orchestrator.run_investigation(
                question=question,
                adapter=adapter,
                db_type=db_type,
                log_callback=sync_log_callback,
                chat_history=chat_history
            )
            
            # Resolve dashboard URL dynamically matching client connection host
            dashboard_url = result.get("dashboard_url", "")
            if dashboard_url and "localhost:8002" in dashboard_url:
                scheme = "https" if websocket.url.scheme == "wss" else "http"
                base_url = f"{scheme}://{websocket.url.netloc}"
                dashboard_url = dashboard_url.replace("http://localhost:8002", base_url)

            # 4. Return success result
            from fastapi.encoders import jsonable_encoder
            await websocket.send_json(jsonable_encoder({
                "type": "result",
                "report": result["report"],
                "visualization": result["visualization"],
                "history": result["history"],
                "dashboard_url": dashboard_url
            }))
            
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Swarm Execution error: {str(e)}"})
        finally:
            await adapter.close()
            
    except WebSocketDisconnect:
        log_callback_active = False
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": f"Server error: {str(e)}"})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass

@app.get("/api/download-dashboard")
async def download_dashboard(path: str):
    import os
    # Extract filename safely
    filename = os.path.basename(path)
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dashboard file not found.")
    return FileResponse(
        file_path,
        media_type="image/png",
        filename="swarm_analyst_dashboard.png"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)
