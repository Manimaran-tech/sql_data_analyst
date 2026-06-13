import asyncpg  # type: ignore
from typing import Tuple, Optional, Dict, Any
from backend.adapters.base import BaseDbAdapter
from backend.utils import format_ascii_table

class PostgresAdapter(BaseDbAdapter):
    """
    Adapter for connecting, reflecting, and querying PostgreSQL databases.
    """

    def __init__(self):
        self._conn = None

    async def connect(self, credentials: dict) -> bool:
        """
        credentials key structure:
        - host: str
        - port: int / str
        - user: str
        - password: str
        - database: str
        """
        try:
            self._conn = await asyncpg.connect(
                host=credentials.get("host", "localhost"),
                port=int(credentials.get("port", 5432)),
                user=credentials.get("user"),
                password=credentials.get("password"),
                database=credentials.get("database")
            )
            return True
        except Exception as e:
            raise ConnectionError(f"PostgreSQL connection failed: {str(e)}")

    async def get_schema(self) -> str:
        if not self._conn:
            raise RuntimeError("Database not connected.")

        # Query all public tables and their columns, types, nullability, and primary key status
        query = """
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                (SELECT EXISTS(
                    SELECT 1 FROM information_schema.key_column_usage kcu
                    JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'PRIMARY KEY' 
                      AND kcu.table_name = t.table_name 
                      AND kcu.column_name = c.column_name
                )) as is_primary
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
            ORDER BY t.table_name, c.ordinal_position;
        """
        
        try:
            rows = await self._conn.fetch(query)
            
            # Group by table
            schema_data = {}
            for row in rows:
                t_name = row["table_name"]
                if t_name not in schema_data:
                    schema_data[t_name] = []
                schema_data[t_name].append({
                    "column": row["column_name"],
                    "type": row["data_type"],
                    "nullable": row["is_nullable"] == "YES",
                    "pk": row["is_primary"]
                })

            lines = ["DATABASE SCHEMA — PostgreSQL Database (Public Schema)", "=" * 55, ""]
            for table, cols in schema_data.items():
                # Get table count
                cnt_row = await self._conn.fetchrow(f'SELECT COUNT(*) FROM "{table}"')
                row_count = cnt_row[0] if cnt_row else 0

                lines.append(f"📊 {table} ({row_count} rows)")
                lines.append("-" * 45)
                for col in cols:
                    pk_str = " [PK]" if col["pk"] else ""
                    null_str = " (nullable)" if col["nullable"] else ""
                    lines.append(f"  {col['column']:25s} {col['type']:15s}{pk_str}{null_str}")
                lines.append("")

            return "\n".join(lines)
        except Exception as e:
            return f"Error reflecting PostgreSQL schema: {str(e)}"

    async def execute(self, query: str) -> Tuple[Optional[str], int, Optional[str], Optional[list]]:
        if not self._conn:
            return None, 0, "Database not connected.", None

        from backend.utils import clean_query_string
        query_clean = clean_query_string(query)
        if not query_clean.upper().startswith("SELECT"):
            return None, 0, "Only SELECT queries are allowed. Please write a SELECT statement.", None

        try:
            records = await self._conn.fetch(query_clean)
            
            # Convert record objects to standard dictionaries
            rows = [dict(record) for record in records]
            
            if not rows:
                return "(empty result)", 0, None, []
                
            formatted_table, row_count = format_ascii_table(rows)
            return formatted_table, row_count, None, rows
        except Exception as e:
            return None, 0, f"SQL Error (Postgres): {str(e)}", None

    async def get_preview(self) -> Tuple[str, list]:
        if not self._conn:
            return "", []
        # Query list of public tables
        query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """
        try:
            tables = await self._conn.fetch(query)
            if not tables:
                return "", []
            first_table = tables[0]["table_name"]
            records = await self._conn.fetch(f'SELECT * FROM "{first_table}" LIMIT 100')
            from decimal import Decimal
            rows = []
            for record in records:
                row = {}
                for k, v in dict(record).items():
                    row[k] = float(v) if isinstance(v, Decimal) else v
                rows.append(row)
            return first_table, rows
        except Exception:
            return "", []

    async def close(self):
        if self._conn:
            await self._conn.close()
            self._conn = None
        return True
