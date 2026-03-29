"""
Task definitions for the SQL Data Analyst Investigation Environment.

5 tasks from Easy → Hard, each with ground-truth facts for grading.
"""

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class Task:
    """A single investigation task."""
    id: str
    title: str
    difficulty: str
    max_steps: int
    description: str
    ground_truth_facts: List[str]
    key_tables: List[str]
    hints: str = ""


TASKS: Dict[str, Task] = {

    # ── Task 1: Easy ─────────────────────────────────────────────────
    "basic_lookup": Task(
        id="basic_lookup",
        title="Top Revenue Products",
        difficulty="easy",
        max_steps=5,
        description=(
            "List the top 5 products by total revenue in Q4 2025 (October-December). "
            "For each product, report the product name, category, and total revenue generated. "
            "Order them from highest to lowest revenue."
        ),
        ground_truth_facts=[
            "iPhone Pro Max 16",
            "MacBook Air M4",
            "Dell XPS 15",
            "iPad Pro 2025",
            "Standing Desk",
            "Q4 2025",
            "revenue",
        ],
        key_tables=["orders", "order_items", "products"],
    ),

    # ── Task 2: Easy-Medium ──────────────────────────────────────────
    "comparative_analysis": Task(
        id="comparative_analysis",
        title="Product Return Rate Analysis",
        difficulty="medium",
        max_steps=7,
        description=(
            "Compare return rates across all product categories. "
            "Which category has the worst (highest) return rate? "
            "Investigate why — what are the most common return reasons for that category? "
            "Provide specific numbers and percentages."
        ),
        ground_truth_facts=[
            "Electronics",
            "highest return rate",
            "Defective",
            "return rate",
            "percentage",
        ],
        key_tables=["returns", "order_items", "products", "orders"],
    ),

    # ── Task 3: Medium ───────────────────────────────────────────────
    "trend_investigation": Task(
        id="trend_investigation",
        title="Customer Segment Growth Analysis",
        difficulty="medium",
        max_steps=8,
        description=(
            "Analyze customer segment performance over 2024-2025. "
            "Which customer segment grew the fastest in terms of order volume and revenue? "
            "What is driving their growth — is it new customer acquisition, "
            "increased order frequency, or higher average order values? "
            "Support your findings with specific data."
        ),
        ground_truth_facts=[
            "Premium",
            "fastest growing",
            "growth",
            "order volume",
            "2025",
        ],
        key_tables=["customers", "orders", "order_items"],
    ),

    # ── Task 4: Hard ─────────────────────────────────────────────────
    "anomaly_diagnosis": Task(
        id="anomaly_diagnosis",
        title="Revenue Drop Root Cause Analysis",
        difficulty="hard",
        max_steps=10,
        description=(
            "The company's overall revenue dropped significantly in Q3 2025 (July-September) "
            "compared to Q2 2025. Investigate the root cause of this decline. "
            "Your investigation should identify: "
            "1) How large was the drop? "
            "2) Which product category was most affected? "
            "3) Was the drop concentrated in a specific region? "
            "4) What is the most likely root cause? "
            "Provide a clear chain of reasoning with supporting data."
        ),
        ground_truth_facts=[
            "Q3 2025",
            "revenue drop",
            "Electronics",
            "APAC",
            "decline",
            "region",
        ],
        key_tables=["orders", "order_items", "products", "customers"],
    ),

    # ── Task 5: Hard ─────────────────────────────────────────────────
    "strategic_recommendation": Task(
        id="strategic_recommendation",
        title="Product Discontinuation Recommendations",
        difficulty="hard",
        max_steps=12,
        description=(
            "Management wants to identify products that should be discontinued. "
            "Find 3 products that are strong candidates for discontinuation based on a "
            "combination of: high return rates, poor customer reviews, and low profitability. "
            "For each product, provide: "
            "1) The product name and category "
            "2) Its return rate compared to category average "
            "3) Its average review rating "
            "4) Evidence of low profitability (e.g., heavy discounting, low volume) "
            "Justify each recommendation with specific data."
        ),
        ground_truth_facts=[
            "UltraBass X500",
            "SmartView Tab 3",
            "QuickDry Pro Jacket",
            "discontinue",
            "return rate",
            "review",
            "rating",
        ],
        key_tables=["products", "returns", "reviews", "order_items", "orders"],
    ),
}


def get_task(task_id: str) -> Task:
    """Get a task by ID. Raises KeyError if not found."""
    if task_id not in TASKS:
        raise KeyError(
            f"Unknown task_id '{task_id}'. Available tasks: {list(TASKS.keys())}"
        )
    return TASKS[task_id]


def list_tasks() -> List[Dict]:
    """Return list of task summaries for the /tasks endpoint."""
    return [
        {
            "id": t.id,
            "title": t.title,
            "difficulty": t.difficulty,
            "max_steps": t.max_steps,
            "description": t.description,
        }
        for t in TASKS.values()
    ]
