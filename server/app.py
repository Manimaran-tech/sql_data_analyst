"""
FastAPI application for the SQL Data Analyst Investigation Environment.

Endpoints (via OpenEnv create_app):
    - POST /reset: Reset the environment (accepts task_id kwarg)
    - POST /step: Execute an AnalystAction (sql query or final answer)
    - GET /state: Get current environment state
    - GET /schema: Get action/observation schemas
    - WS /ws: WebSocket endpoint for persistent sessions

Custom endpoints:
    - GET /tasks: List available investigation tasks

Usage:
    uvicorn server.app:app --reload --host 0.0.0.0 --port 8000
"""

try:
    from openenv.core.env_server.http_server import create_app
except Exception as e:
    raise ImportError(
        "openenv is required. Install with: uv sync"
    ) from e

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import AnalystAction, AnalystObservation
from server.environment import SqlDataAnalystEnvironment
from server.tasks import list_tasks as _list_tasks

# ── Create the app ───────────────────────────────────────────────────────────

app = create_app(
    SqlDataAnalystEnvironment,
    AnalystAction,
    AnalystObservation,
    env_name="sql_data_analyst",
    max_concurrent_envs=1,
)


# ── Custom endpoints ─────────────────────────────────────────────────────────

@app.get("/")
def root():
    """Root endpoint — required by HF Spaces health probe."""
    return {"name": "SQL Data Analyst Investigation Environment", "status": "running"}


@app.get("/tasks")
def get_tasks():
    """Return list of available investigation tasks and action schema."""
    return {
        "tasks": _list_tasks(),
        "action_schema": {
            "AnalystAction": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "SQL SELECT query (query mode)"},
                    "answer": {"type": "string", "description": "Final analytical answer (answer mode)"},
                    "evidence": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Supporting findings (used with answer mode)",
                    },
                },
                "oneOf": [
                    {"required": ["sql"]},
                    {"required": ["answer"]},
                ],
            },
        },
        "instructions": (
            "Set 'sql' field to execute a SQL SELECT query and explore the database. "
            "When ready, set 'answer' field (and optionally 'evidence') to submit your final analysis. "
            "You earn partial rewards for productive queries and a final score "
            "based on correctness, completeness, and efficiency."
        ),
    }


# ── Entry point ──────────────────────────────────────────────────────────────

def main(host: str = "0.0.0.0", port: int = 7860):
    """Direct execution via: python -m server.app"""
    import uvicorn
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    # Note: openenv validate requires the exact string "main()" to be present
    main()
