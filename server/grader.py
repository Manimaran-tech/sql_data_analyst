"""
Multi-dimensional grading system for the SQL Data Analyst Environment.

Scoring:
- Per-step reward (QueryAction):  information gain (0.0-0.2), error penalty (-0.05), repeat penalty (-0.1)
- Final reward (AnswerAction):    correctness (0.6) + completeness (0.3) + efficiency (0.1)
- Total episode score:            clipped to [0.0, 1.0]
"""

import re
import sqlite3
from typing import Dict, List, Optional, Set, Tuple

from .tasks import Task


# ── Per-Step Grading (QueryAction) ───────────────────────────────────────────

def compute_step_reward(
    sql: str,
    result_table: Optional[str],
    error: Optional[str],
    queries_executed: List[str],
    tables_explored: Set[str],
    key_tables: List[str],
) -> Tuple[float, Set[str]]:
    """
    Compute reward for a single QueryAction step.
    
    Returns (reward, updated_tables_explored).
    """
    # Error penalty
    if error:
        return -0.05, tables_explored

    # Duplicate query penalty (exact or near-duplicate)
    sql_normalized = _normalize_sql(sql)
    for prev in queries_executed:
        if _normalize_sql(prev) == sql_normalized:
            return -0.1, tables_explored

    # Information gain: reward for exploring new tables relevant to the task
    new_tables = _extract_tables(sql) - tables_explored
    updated_tables = tables_explored | new_tables

    reward = 0.0

    # Reward for touching key tables (task-relevant)
    key_set = set(key_tables)
    new_key_tables = new_tables & key_set
    if new_key_tables:
        reward += 0.15 * len(new_key_tables) / len(key_set)

    # Small reward for any new table
    new_non_key = new_tables - key_set
    if new_non_key:
        reward += 0.03

    # Reward for producing non-empty results (productive query)
    if result_table and "empty result" not in result_table.lower():
        reward += 0.05

    # Cap step reward
    reward = min(reward, 0.2)

    return round(reward, 3), updated_tables


# ── Final Grading (AnswerAction) ─────────────────────────────────────────────

def compute_final_reward(
    answer: str,
    evidence: List[str],
    task: Task,
    steps_used: int,
    cumulative_step_reward: float,
) -> Dict:
    """
    Grade the final answer.
    
    Returns dict with:
      - correctness: 0.0-1.0 (how many ground truth facts are present?)
      - completeness: 0.0-1.0 (how thorough is the answer?)
      - efficiency: multiplier based on steps used vs max
      - final_score: weighted combination, clipped to [0.0, 1.0]
      - breakdown: detailed scoring components
    """
    combined_text = (answer + " " + " ".join(evidence)).lower()

    # ── Correctness (60%) ────────────────────────────────────────
    # Check each ground truth fact
    facts_found = 0
    fact_details = []
    for fact in task.ground_truth_facts:
        present = fact.lower() in combined_text
        facts_found += int(present)
        fact_details.append({"fact": fact, "found": present})

    correctness = facts_found / len(task.ground_truth_facts) if task.ground_truth_facts else 0.0

    # ── Completeness (30%) ───────────────────────────────────────
    # Based on answer length, evidence count, and specificity
    length_score = min(len(answer) / 200, 1.0)  # Longer answers tend to be more complete
    evidence_score = min(len(evidence) / 3, 1.0)  # Expect 2-3 pieces of evidence

    # Check for numeric specificity (does the answer contain actual numbers?)
    numbers = re.findall(r'\d+\.?\d*', combined_text)
    numeric_score = min(len(numbers) / 3, 1.0)

    completeness = (length_score * 0.3 + evidence_score * 0.4 + numeric_score * 0.3)

    # ── Efficiency (10%) ─────────────────────────────────────────
    if steps_used > 0:
        efficiency = min(task.max_steps / steps_used, 1.3)
    else:
        efficiency = 1.0

    # ── Total Score ──────────────────────────────────────────────
    weighted = correctness * 0.6 + completeness * 0.3 + (efficiency / 1.3) * 0.1
    total = max(0.0, min(1.0, cumulative_step_reward + weighted))

    return {
        "correctness": round(correctness, 3),
        "completeness": round(completeness, 3),
        "efficiency": round(efficiency, 3),
        "weighted_score": round(weighted, 3),
        "cumulative_step_reward": round(cumulative_step_reward, 3),
        "final_score": round(total, 3),
        "facts_checked": fact_details,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _normalize_sql(sql: str) -> str:
    """Normalize SQL for duplicate detection."""
    s = sql.lower().strip().rstrip(";")
    s = re.sub(r'\s+', ' ', s)
    return s


def _extract_tables(sql: str) -> Set[str]:
    """Extract table names referenced in a SQL query."""
    known_tables = {
        "customers", "products", "suppliers", "orders",
        "order_items", "shipments", "returns", "reviews",
    }
    sql_lower = sql.lower()
    found = set()
    for table in known_tables:
        # Match table name as whole word
        if re.search(rf'\b{table}\b', sql_lower):
            found.add(table)
    return found
