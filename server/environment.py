"""
SQL Data Analyst Investigation Environment.

Core environment logic implementing reset/step/state for OpenEnv.
Supports dual action modes via AnalystAction: sql (query) or answer (submit).
"""

import uuid
from typing import Optional, Dict

from openenv.core.env_server.interfaces import Environment

from models import AnalystAction, AnalystObservation, AnalystState
from server.database import create_database, execute_query, get_schema_string
from server.tasks import get_task, TASKS, Task
from server.grader import compute_step_reward, compute_final_reward


class SqlDataAnalystEnvironment(Environment):
    """
    Multi-step SQL Data Investigation Environment.
    
    An AI agent investigates a realistic e-commerce database through iterative
    SQL queries to answer complex analytical questions.
    """

    SUPPORTS_CONCURRENT_SESSIONS = True

    def __init__(self):
        super().__init__()
        self._db = create_database(seed=42)
        self._state = AnalystState()
        self._task: Optional[Task] = None
        self._tables_explored: set = set()
        self._cumulative_step_reward: float = 0.0
        self._grading_result: Optional[Dict] = None

    def reset(
        self,
        seed: Optional[int] = None,
        episode_id: Optional[str] = None,
        **kwargs,
    ) -> AnalystObservation:
        """
        Reset the environment for a new investigation episode.
        
        Kwargs:
            task_id: str — which task to load (default: first task)
        """
        # Recreate database (deterministic)
        db_seed = seed if seed is not None else 42
        self._db = create_database(seed=db_seed)

        # Select task
        task_id = kwargs.get("task_id", None)
        if task_id and task_id in TASKS:
            self._task = get_task(task_id)
        else:
            # Default to first task
            self._task = get_task(list(TASKS.keys())[0])

        # Reset state
        self._tables_explored = set()
        self._cumulative_step_reward = 0.0
        self._grading_result = None

        self._state = AnalystState(
            episode_id=episode_id or str(uuid.uuid4()),
            step_count=0,
            task_id=self._task.id,
            queries_executed=[],
            results_summary=[],
            total_reward=0.0,
            max_steps=self._task.max_steps,
            current_step=0,
            tables_explored=[],
            done=False,
        )

        schema = get_schema_string(self._db)

        return AnalystObservation(
            schema_info=schema,
            task_description=self._task.description,
            steps_remaining=self._task.max_steps,
            step_reward=0.0,
            done=False,
            reward=None,
        )

    def step(
        self,
        action: AnalystAction,
        timeout_s: Optional[float] = None,
        **kwargs,
    ) -> AnalystObservation:
        """
        Execute one step. The action mode is determined by which field is set:
        - action.sql is set → execute a SQL query
        - action.answer is set → submit final answer for grading
        """
        if self._state.done:
            return AnalystObservation(
                task_description=self._task.description if self._task else "",
                steps_remaining=0,
                step_reward=0.0,
                error="Episode is already complete. Call reset() to start a new episode.",
                done=True,
                reward=self._state.total_reward,
            )

        self._state.step_count += 1
        self._state.current_step += 1

        # Determine action mode
        if action.sql and not action.answer:
            return self._handle_query(action)
        elif action.answer:
            return self._handle_answer(action)
        else:
            return AnalystObservation(
                task_description=self._task.description,
                steps_remaining=max(0, self._task.max_steps - self._state.current_step),
                step_reward=0.0,
                error="Invalid action. Set either 'sql' (to query) or 'answer' (to submit).",
                done=False,
                reward=0.0,
            )

    def _handle_query(self, action: AnalystAction) -> AnalystObservation:
        """Handle a SQL query action."""
        sql = action.sql.strip()

        # Execute query
        result_table, row_count, error = execute_query(self._db, sql)

        # Compute step reward
        reward, self._tables_explored = compute_step_reward(
            sql=sql,
            result_table=result_table,
            error=error,
            queries_executed=self._state.queries_executed,
            tables_explored=self._tables_explored,
            key_tables=self._task.key_tables,
        )

        # Update state
        self._state.queries_executed.append(sql)
        if result_table:
            summary_lines = result_table.split("\n")[:5]
            self._state.results_summary.append("\n".join(summary_lines))
        self._state.tables_explored = list(self._tables_explored)
        self._cumulative_step_reward += reward
        self._state.total_reward = round(self._cumulative_step_reward, 3)

        steps_remaining = max(0, self._task.max_steps - self._state.current_step)

        # Check if out of steps
        done = steps_remaining <= 0
        if done:
            self._state.done = True

        return AnalystObservation(
            query_result=result_table,
            row_count=row_count,
            error=error,
            task_description=self._task.description,
            steps_remaining=steps_remaining,
            step_reward=reward,
            done=done,
            reward=round(self._cumulative_step_reward, 3) if done else reward,
        )

    def _handle_answer(self, action: AnalystAction) -> AnalystObservation:
        """Handle a final answer submission."""
        evidence = action.evidence if action.evidence else []

        # Grade the answer
        grading = compute_final_reward(
            answer=action.answer,
            evidence=evidence,
            task=self._task,
            steps_used=self._state.current_step,
            cumulative_step_reward=self._cumulative_step_reward,
        )

        self._grading_result = grading
        self._state.done = True
        self._state.total_reward = grading["final_score"]

        # Format grading feedback
        feedback = (
            f"📊 INVESTIGATION COMPLETE\n"
            f"{'=' * 40}\n"
            f"Correctness:  {grading['correctness']:.1%} (facts matched)\n"
            f"Completeness: {grading['completeness']:.1%} (answer depth)\n"
            f"Efficiency:   {grading['efficiency']:.2f}x (step usage)\n"
            f"{'─' * 40}\n"
            f"Final Score:  {grading['final_score']:.3f}\n"
        )

        return AnalystObservation(
            query_result=feedback,
            task_description=self._task.description,
            steps_remaining=0,
            step_reward=grading["weighted_score"],
            done=True,
            reward=grading["final_score"],
        )

    @property
    def state(self) -> AnalystState:
        return self._state
