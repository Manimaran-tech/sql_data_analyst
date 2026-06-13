import os
import firebase_admin
from firebase_admin import credentials as firebase_creds
from firebase_admin import firestore
from google.cloud.firestore import Query
from typing import Tuple, Optional, Dict, Any, List
from backend.adapters.base import BaseDbAdapter
from backend.utils import format_ascii_table
import json

class FirebaseAdapter(BaseDbAdapter):
    """
    Adapter for connecting, reflecting, and querying Firebase Firestore collections.
    Expected query is a JSON string with format:
    {
      "collection": "collection_name",
      "where": [
         ["field_name", "operator", "value"]  # operator can be: ==, >, <, >=, <=, in, array_contains
      ],
      "order_by": "field_name" or ["field_name", "desc"],
      "limit": 50
    }
    """

    def __init__(self):
        self._db = None
        self._app = None

    async def connect(self, credentials: dict) -> bool:
        """
        credentials key structure:
        - service_account_path: str (path to firebase service account JSON file)
        - project_id: Optional[str]
        """
        try:
            sa_path = credentials.get("service_account_path")
            if not sa_path or not os.path.exists(sa_path):
                raise FileNotFoundError(f"Firebase Service Account JSON file not found: {sa_path}")

            # Auto-detect emulator if using dummy sa or demo project ID
            project_id = credentials.get("project_id", "default")
            if "dummy_firebase_sa.json" in sa_path or (project_id and project_id.startswith("demo-")):
                if "FIRESTORE_EMULATOR_HOST" not in os.environ:
                    os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
                    print(f"[FirebaseAdapter] Automatically routing to local Firestore Emulator at {os.environ['FIRESTORE_EMULATOR_HOST']}")

            # Verify if firebase app is already initialized
            app_name = f"app_{project_id}"
            
            try:
                self._app = firebase_admin.get_app(app_name)
            except ValueError:
                # App does not exist, initialize it
                cred = firebase_creds.Certificate(sa_path)
                self._app = firebase_admin.initialize_app(cred, name=app_name)

            self._db = firestore.client(app=self._app)
            return True
        except Exception as e:
            raise ConnectionError(f"Firebase Firestore connection failed: {str(e)}")

    async def get_schema(self) -> str:
        if not self._db:
            raise RuntimeError("Firebase database not connected.")

        try:
            # List root collections
            collections = self._db.collections()
            
            lines = ["DATABASE SCHEMA — Firebase Firestore (Collections)", "=" * 55, ""]
            
            for col in collections:
                col_name = col.id
                
                # Fetch first document to infer types
                docs = list(col.limit(1).stream())
                
                lines.append(f"🗂️ {col_name}")
                lines.append("-" * 45)
                
                if docs:
                    doc_data = docs[0].to_dict()
                    for key, val in doc_data.items():
                        val_type = type(val).__name__
                        lines.append(f"  {key:25s} {val_type}")
                else:
                    lines.append("  (empty collection / no documents)")
                lines.append("")

            return "\n".join(lines)
        except Exception as e:
            return f"Error reflecting Firebase schema: {str(e)}"

    async def execute(self, query: str) -> Tuple[Optional[str], int, Optional[str], Optional[list]]:
        if not self._db:
            return None, 0, "Firebase database not connected.", None

        try:
            from backend.utils import clean_query_string
            query_clean = clean_query_string(query)
            # Parse the JSON query
            query_data = json.loads(query_clean)
            collection_name = query_data.get("collection")
            if not collection_name:
                return None, 0, "Invalid Firestore query. JSON must specify 'collection'.", None

            # Build query
            query_ref = self._db.collection(collection_name)

            # Apply filters
            filters = query_data.get("where", [])
            for field, op, val in filters:
                if op == "==":
                    query_ref = query_ref.where(field, "==", val)
                elif op == ">":
                    query_ref = query_ref.where(field, ">", val)
                elif op == "<":
                    query_ref = query_ref.where(field, "<", val)
                elif op == ">=":
                    query_ref = query_ref.where(field, ">=", val)
                elif op == "<=":
                    query_ref = query_ref.where(field, "<=", val)
                elif op == "in":
                    query_ref = query_ref.where(field, "in", val)
                elif op == "array_contains":
                    query_ref = query_ref.where(field, "array_contains", val)

            # Apply ordering
            order_by = query_data.get("order_by")
            if order_by:
                if isinstance(order_by, list) and len(order_by) == 2:
                    field, direction = order_by
                    direction = Query.DESCENDING if direction.lower() == "desc" else Query.ASCENDING
                    query_ref = query_ref.order_by(field, direction=direction)
                else:
                    query_ref = query_ref.order_by(order_by)

            # Apply limit
            limit = query_data.get("limit", 50)
            query_ref = query_ref.limit(min(limit, 50))

            # Stream results
            docs = query_ref.stream()
            results = []
            for doc in docs:
                doc_dict = doc.to_dict()
                doc_dict["_document_id"] = doc.id
                results.append(doc_dict)

            if not results:
                return "(empty result)", 0, None, []

            formatted_table, row_count = format_ascii_table(results)
            return formatted_table, row_count, None, results

        except json.JSONDecodeError:
            return None, 0, "Firestore Query must be a valid JSON string containing 'collection' and optionally 'where', 'order_by', and 'limit'.", None
        except Exception as e:
            return None, 0, f"Firebase Firestore Error: {str(e)}", None

    async def get_preview(self) -> Tuple[str, list]:
        if not self._db:
            return "", []
        try:
            collections = list(self._db.collections())
            if not collections:
                return "", []
            first_col = collections[0].id
            docs = self._db.collection(first_col).limit(100).stream()
            rows = []
            for doc in docs:
                doc_dict = doc.to_dict()
                doc_dict["_document_id"] = doc.id
                rows.append(doc_dict)
            return first_col, rows
        except Exception:
            return "", []

    async def close(self):
        self._db = None
        self._app = None
        return True
