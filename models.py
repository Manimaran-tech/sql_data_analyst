"""
Data models for the SQL Data Analyst Investigation Environment.

Uses a single AnalystAction with optional fields to represent both
query actions (set `sql`) and answer actions (set `answer`).
"""

from typing import Optional
from openenv.core.env_server.types import Action, Observation, State
from pydantic import Field


class AnalystAction(Action):
    """
    Unified action for the SQL Data Analyst environment.
    
    Two modes:
    - Query mode: set `sql` field to execute a SQL SELECT query
    - Answer mode: set `answer` field to submit your final analysis
    
    Only one of `sql` or `answer` should be set per step.
    """
    sql: Optional[str] = Field(None, description="SQL SELECT query to execute against the e-commerce database")
    answer: Optional[str] = Field(None, description="Final analytical answer to the investigation question")
    evidence: list[str] = Field(default_factory=list, description="Key findings supporting the answer (used with answer mode)")


class AnalystObservation(Observation):
    """What the agent sees after each step."""
    query_result: Optional[str] = Field(None, description="Query result as formatted table")
    row_count: Optional[int] = Field(None, description="Number of rows returned")
    error: Optional[str] = Field(None, description="SQL error message if query failed")
    schema_info: Optional[str] = Field(None, description="Database schema (shown on reset)")
    task_description: str = Field(..., description="The analytical question to investigate")
    steps_remaining: int = Field(..., description="Steps left in this episode")
    step_reward: float = Field(0.0, description="Reward earned this step")


class AnalystState(State):
    """Internal episode state tracked by the server."""
    task_id: str = Field("", description="Current task identifier")
    queries_executed: list[str] = Field(default_factory=list, description="History of queries run")
    results_summary: list[str] = Field(default_factory=list, description="Summary of each query result")
    total_reward: float = Field(0.0, description="Accumulated reward")
    max_steps: int = Field(10, description="Step budget for this task")
    current_step: int = Field(0, description="Current step number")
    tables_explored: list[str] = Field(default_factory=list, description="Tables touched by queries so far")
    done: bool = Field(False, description="Whether the episode is complete")
