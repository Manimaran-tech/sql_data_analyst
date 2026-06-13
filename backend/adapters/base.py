from abc import ABC, abstractmethod
from typing import Tuple, Optional

class BaseDbAdapter(ABC):
    """
    Abstract Base Class for all database and dataset connections.
    Provides a unified interface for the Swarm Agents to inspect
    and query different data sources (SQL, NoSQL, Flat Files).
    """

    @abstractmethod
    async def connect(self, credentials: dict) -> bool:
        """
        Establish a connection to the data source using the provided credentials.
        Returns True if successful, raises an exception or returns False otherwise.
        """
        pass

    @abstractmethod
    async def get_schema(self) -> str:
        """
        Retrieve a human-readable schema of the database or dataset
        for the Schema Agent's analysis.
        """
        pass

    @abstractmethod
    async def execute(self, query: str) -> Tuple[Optional[str], int, Optional[str], Optional[list]]:
        """
        Execute a query command against the data source.
        Returns a tuple of:
          - formatted_result: A readable string representation of the rows/data (e.g. ASCII table).
          - row_count: The number of rows/records returned.
          - error: Any exception/database error message if execution failed, otherwise None.
          - raw_data: A list of dicts representing the raw row records returned, or None if failed.
        """
        pass

    @abstractmethod
    async def get_preview(self) -> Tuple[str, list]:
        """
        Retrieve a preview of the data (e.g. first 100 rows of the first table).
        Returns a tuple of (table_name, list_of_dicts).
        """
        pass

