import os
import duckdb  # type: ignore
import pandas as pd
from typing import Tuple, Optional, Dict, Any, List
from backend.adapters.base import BaseDbAdapter
from backend.utils import format_ascii_table

class FlatFileAdapter(BaseDbAdapter):
    """
    Adapter for querying local CSV and Excel files via DuckDB SQL engine.
    """

    def __init__(self):
        self._conn = None
        self._files: Dict[str, str] = {} # table_name -> file_path

    async def connect(self, credentials: dict) -> bool:
        """
        credentials key structure:
        - files: dict mapping table_name to absolute_file_path (e.g. {'sales': 'd:/files/sales.csv'})
        """
        try:
            self._conn = duckdb.connect(database=":memory:")
            self._files = credentials.get("files", {})
            
            # Register each file as a view or table in DuckDB
            for table_name, file_path in self._files.items():
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"File not found: {file_path}")

                ext = os.path.splitext(file_path)[1].lower()
                if ext in (".csv", ".txt"):
                    # Create standard CSV view
                    self._conn.execute(f"CREATE VIEW {table_name} AS SELECT * FROM read_csv_auto('{file_path.replace(chr(92), '/')}')")
                elif ext in (".xlsx", ".xls"):
                    # Use pandas to read excel sheet and register it in DuckDB
                    df = pd.read_excel(file_path)
                    self._conn.register(table_name, df)
                else:
                    raise ValueError(f"Unsupported file format: {ext}")

            return True
        except Exception as e:
            raise ConnectionError(f"FlatFile adapter connection failed: {str(e)}")

    async def get_schema(self) -> str:
        if not self._conn:
            raise RuntimeError("Database engine not initialized.")

        try:
            lines = ["DATABASE SCHEMA — Local Dataset Tables (CSV/Excel)", "=" * 55, ""]
            
            for table_name in self._files.keys():
                # Query table info
                columns_info = self._conn.execute(f"PRAGMA table_info({table_name})").fetchall()
                row_count = self._conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                
                lines.append(f"📊 {table_name} ({row_count} rows)")
                lines.append("-" * 45)
                
                for col in columns_info:
                    # col structure: (cid, name, type, notnull, dflt_value, pk)
                    col_name = col[1]
                    col_type = col[2]
                    nullable = " (nullable)" if not col[3] else ""
                    pk = " [PK]" if col[5] else ""
                    lines.append(f"  {col_name:25s} {col_type:15s}{pk}{nullable}")
                lines.append("")

            return "\n".join(lines)
        except Exception as e:
            return f"Error reflecting flat files schema: {str(e)}"

    async def execute(self, query: str) -> Tuple[Optional[str], int, Optional[str], Optional[list]]:
        if not self._conn:
            return None, 0, "Database engine not connected.", None

        from backend.utils import clean_query_string
        query_clean = clean_query_string(query)
        if not query_clean.upper().startswith("SELECT"):
            return None, 0, "Only SELECT queries are allowed. Please write a SELECT statement.", None

        try:
            # Query DuckDB and fetch as list of dicts
            res = self._conn.execute(query_clean)
            columns = [desc[0] for desc in res.description]
            records = res.fetchall()

            rows = [dict(zip(columns, r)) for r in records]

            if not rows:
                return "(empty result)", 0, None, []

            formatted_table, row_count = format_ascii_table(rows)
            return formatted_table, row_count, None, rows

        except Exception as e:
            return None, 0, f"SQL Error (DuckDB): {str(e)}", None

    async def get_preview(self) -> Tuple[str, list]:
        if not self._conn or not self._files:
            return "", []
        # Get first table name
        first_table = list(self._files.keys())[0]
        try:
            res = self._conn.execute(f"SELECT * FROM {first_table} LIMIT 100")
            columns = [desc[0] for desc in res.description]
            records = res.fetchall()
            rows = [dict(zip(columns, r)) for r in records]
            return first_table, rows
        except Exception:
            return first_table, []

    async def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None
            self._files = {}
        return True
