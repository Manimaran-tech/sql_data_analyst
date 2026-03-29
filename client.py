"""SQL Data Analyst Investigation Environment Client."""

from typing import Dict

from openenv.core import EnvClient
from openenv.core.client_types import StepResult

from models import AnalystAction, AnalystObservation, AnalystState


class SqlDataAnalystEnv(
    EnvClient[AnalystAction, AnalystObservation, AnalystState]
):
    """
    Client for the SQL Data Analyst Investigation Environment.
    
    Usage:
        async with SqlDataAnalystEnv(base_url="http://localhost:8000") as env:
            result = await env.reset(task_id="anomaly_diagnosis")
            result = await env.step(AnalystAction(sql="SELECT ..."))
            result = await env.step(AnalystAction(answer="The root cause is..."))
    """

    def _step_payload(self, action: AnalystAction) -> Dict:
        payload = {}
        if action.sql is not None:
            payload["sql"] = action.sql
        if action.answer is not None:
            payload["answer"] = action.answer
        if action.evidence:
            payload["evidence"] = action.evidence
        return payload

    def _parse_result(self, payload: Dict) -> StepResult[AnalystObservation]:
        obs_data = payload.get("observation", {})
        observation = AnalystObservation(
            query_result=obs_data.get("query_result"),
            row_count=obs_data.get("row_count"),
            error=obs_data.get("error"),
            schema_info=obs_data.get("schema_info"),
            task_description=obs_data.get("task_description", ""),
            steps_remaining=obs_data.get("steps_remaining", 0),
            step_reward=obs_data.get("step_reward", 0.0),
            done=payload.get("done", False),
            reward=payload.get("reward"),
            metadata=obs_data.get("metadata", {}),
        )
        return StepResult(
            observation=observation,
            reward=payload.get("reward"),
            done=payload.get("done", False),
        )

    def _parse_state(self, payload: Dict) -> AnalystState:
        return AnalystState(
            episode_id=payload.get("episode_id"),
            step_count=payload.get("step_count", 0),
            task_id=payload.get("task_id", ""),
            queries_executed=payload.get("queries_executed", []),
            results_summary=payload.get("results_summary", []),
            total_reward=payload.get("total_reward", 0.0),
            max_steps=payload.get("max_steps", 10),
            current_step=payload.get("current_step", 0),
            tables_explored=payload.get("tables_explored", []),
            done=payload.get("done", False),
        )
