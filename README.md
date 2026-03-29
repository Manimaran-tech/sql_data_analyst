---
title: SQL Data Analyst Investigation Environment
emoji: 🔍
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
app_port: 8000
base_path: /web
tags:
  - openenv
---

# 🔍 SQL Data Analyst Investigation Environment

A multi-step data investigation environment where an AI agent analyzes a realistic e-commerce database through iterative SQL queries to answer complex analytical questions — simulating a real-world data analyst workflow.

## 🎯 What Makes This Special

- **Dual Action Space**: `QueryAction` (explore with SQL) vs `AnswerAction` (submit findings)
- **Multi-Step Investigation**: Agent must plan, hypothesize, and iteratively drill down
- **Rich Reward Shaping**: Partial rewards for productive exploration + multi-dimensional final grading
- **Realistic Database**: 8-table e-commerce schema with ~5K+ rows and planted anomalies
- **5 Investigation Tasks**: From easy lookups to complex root cause analysis (easy → hard)

## 🚀 Quick Start

```python
from sql_data_analyst import QueryAction, AnswerAction, SqlDataAnalystEnv

async with SqlDataAnalystEnv(base_url="http://localhost:8000") as env:
    # Start an investigation
    result = await env.reset(task_id="anomaly_diagnosis")
    print(result.observation.task_description)
    print(result.observation.schema_info)

    # Query the database
    result = await env.step(QueryAction(
        sql="SELECT quarter, SUM(revenue) FROM sales GROUP BY quarter"
    ))
    print(result.observation.query_result)

    # Submit your findings
    result = await env.step(AnswerAction(
        answer="Revenue dropped due to Electronics decline in APAC...",
        evidence=["Electronics down 45%", "APAC is the outlier region"]
    ))
    print(f"Score: {result.reward}")
```

## 📊 Investigation Tasks

| # | Task | Difficulty | Steps | Description |
|---|------|-----------|-------|-------------|
| 1 | `basic_lookup` | Easy | 5 | Top 5 products by revenue in Q4 2025 |
| 2 | `comparative_analysis` | Medium | 7 | Compare return rates across categories |
| 3 | `trend_investigation` | Medium | 8 | Identify fastest growing customer segment |
| 4 | `anomaly_diagnosis` | Hard | 10 | Root cause of Q3 2025 revenue drop |
| 5 | `strategic_recommendation` | Hard | 12 | Recommend 3 products to discontinue |

## 🏗️ Database Schema

8-table e-commerce analytics database:

- `customers` — segment, region, join date
- `products` — category, subcategory, price
- `suppliers` — country, reliability score
- `orders` — date, status, total amount
- `order_items` — quantity, price, discount
- `shipments` — ship/delivery dates, carrier
- `returns` — reason, refund amount
- `reviews` — rating (1-5), review text

## 🎯 Reward System

**Per-step (QueryAction):**
- Information gain: +0.0 to +0.2 (new tables, productive results)
- SQL error: -0.05
- Duplicate query: -0.1

**Final (AnswerAction):**
- Correctness × 0.6 (facts matched against ground truth)
- Completeness × 0.3 (answer depth, evidence, specific numbers)
- Efficiency × 0.1 (steps used vs budget)

Total episode score: clipped to [0.0, 1.0]

## 🛠️ Development

```bash
# Run locally
uvicorn server.app:app --reload --port 8000

# Run tests
python test_local.py

# Run baseline (requires OPENAI_API_KEY)
python baseline.py

# Build Docker image
docker build -t sql-data-analyst:latest -f server/Dockerfile .
```

## 📁 Project Structure

```
sql_data_analyst/
├── __init__.py              # Package exports
├── models.py                # QueryAction, AnswerAction, AnalystObservation, AnalystState
├── client.py                # SqlDataAnalystEnv(EnvClient)
├── openenv.yaml             # OpenEnv manifest
├── pyproject.toml           # Dependencies
├── baseline.py              # LLM inference agent
├── test_local.py            # Local test script
├── README.md                # This file
└── server/
    ├── __init__.py
    ├── app.py               # FastAPI server
    ├── environment.py        # Core environment logic
    ├── database.py           # SQLite schema + seed data
    ├── tasks.py              # 5 task definitions
    ├── grader.py             # Multi-dimensional grading
    ├── requirements.txt
    └── Dockerfile
```

## 🏆 Built for the Meta PyTorch Hackathon
