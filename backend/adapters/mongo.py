import json
from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore
from typing import Tuple, Optional, Dict, Any
from backend.adapters.base import BaseDbAdapter
from backend.utils import format_ascii_table

class MongoAdapter(BaseDbAdapter):
    """
    Adapter for connecting, reflecting schema, and querying MongoDB collections.
    Expected query is a JSON string with format:
    {
      "collection": "collection_name",
      "pipeline": [ ... aggregation pipeline stages ... ]
    }
    """

    def __init__(self):
        self._client = None
        self._db = None

    async def connect(self, credentials: dict) -> bool:
        """
        credentials key structure:
        - uri: str (MongoDB connection URI)
        - database: str (database name)
        """
        try:
            uri = credentials.get("uri", "mongodb://localhost:27017")
            db_name = credentials.get("database")
            if not db_name:
                raise ValueError("Database name is required.")
            
            self._client = AsyncIOMotorClient(uri)
            self._db = self._client[db_name]
            
            # Ping database to verify connection
            await self._db.command("ping")
            return True
        except Exception as e:
            raise ConnectionError(f"MongoDB connection failed: {str(e)}")

    async def get_schema(self) -> str:
        if self._db is None:
            raise RuntimeError("Database not connected.")

        try:
            collections = await self._db.list_collection_names()
            
            lines = ["DATABASE SCHEMA — MongoDB Database (Collections)", "=" * 50, ""]
            
            for col_name in collections:
                col = self._db[col_name]
                doc_count = await col.count_documents({})
                
                lines.append(f"🗂️ {col_name} ({doc_count} documents)")
                lines.append("-" * 40)
                
                # Fetch a sample document to infer field names and types
                sample_doc = await col.find_one()
                if sample_doc:
                    for key, val in sample_doc.items():
                        val_type = type(val).__name__
                        lines.append(f"  {key:25s} {val_type}")
                else:
                    lines.append("  (empty collection / no sample document)")
                lines.append("")

            return "\n".join(lines)
        except Exception as e:
            return f"Error reflecting MongoDB schema: {str(e)}"

    async def execute(self, query: str) -> Tuple[Optional[str], int, Optional[str], Optional[list]]:
        if self._db is None:
            return None, 0, "Database not connected.", None

        try:
            from backend.utils import clean_query_string
            query_clean = clean_query_string(query)
            # Parse the JSON query
            query_data = json.loads(query_clean)
            collection_name = query_data.get("collection")
            pipeline = query_data.get("pipeline")

            if not collection_name or pipeline is None:
                return None, 0, "Invalid MongoDB query. JSON must specify 'collection' and 'pipeline' array.", None

            if not isinstance(pipeline, list):
                return None, 0, "'pipeline' must be a JSON list representing the aggregation stages.", None

            # Run aggregation
            collection = self._db[collection_name]
            cursor = collection.aggregate(pipeline)
            
            # Fetch up to 51 rows to format/truncate
            results = []
            async for doc in cursor:
                # Stringify ObjectIds and other MongoDB custom types for readability
                cleaned_doc = {}
                for k, v in doc.items():
                    if hasattr(v, "__str__") and type(v).__name__ not in ("str", "int", "float", "bool", "list", "dict"):
                        cleaned_doc[k] = str(v)
                    else:
                        cleaned_doc[k] = v
                results.append(cleaned_doc)
                if len(results) > 50:
                    break

            if not results:
                return "(empty result)", 0, None, []

            formatted_table, row_count = format_ascii_table(results)
            return formatted_table, row_count, None, results

        except json.JSONDecodeError:
            return None, 0, "MongoDB Query must be a valid JSON string containing 'collection' and 'pipeline' fields.", None
    async def get_preview(self) -> Tuple[str, list]:
        if self._db is None:
            return "", []
        try:
            collections = await self._db.list_collection_names()
            if not collections:
                return "", []
            first_col = collections[0]
            collection = self._db[first_col]
            cursor = collection.find().limit(100)
            rows = []
            async for doc in cursor:
                cleaned_doc = {}
                for k, v in doc.items():
                    if hasattr(v, "__str__") and type(v).__name__ not in ("str", "int", "float", "bool", "list", "dict"):
                        cleaned_doc[k] = str(v)
                    else:
                        cleaned_doc[k] = v
                rows.append(cleaned_doc)
            return first_col, rows
        except Exception:
            return "", []

    async def close(self):
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
        return True
