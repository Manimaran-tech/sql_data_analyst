---
title: SQL Data Analyst Investigation Environment
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

## 📖 Open Source Project & Contributing

SwarmAnalyst is an **open-source project** licensed under the MIT License. We welcome contributions from developers, researchers, and users. Whether you're fixing bugs, adding new features, or improving documentation, please read our [CONTRIBUTING.md](file:///d:/upgrade/sql_data_analyst/CONTRIBUTING.md) guide to learn how to set up your environment, follow coding standards, and submit Pull Requests.

---

## 🛠️ Environment Setup

### 1. Prerequisites
To set up the development environment, make sure you have installed:
* **Python 3.10+**
* **Node.js 18+** & `npm`
* **Rust/Cargo** (via [rustup](https://rustup.rs/))
* **Windows Build Tools** (C++ Build Tools / MSVC Compiler) — *Required for building the Tauri app on Windows*

### 2. Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```
2. Install the backend package in editable development mode:
   ```bash
   pip install -e .[dev]
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```

---

## 🚀 Running & Using the Software

### Development Mode (Web Interface)
To run the components individually for web development:
1. **Start the FastAPI Backend**:
   ```bash
   uvicorn server.app:app --reload --port 8000
   ```
2. **Start the Vite Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### Tauri Desktop App (Local Execution)
To build and run the desktop application wrapper:
1. **Package the Python Backend Sidecar**:
   ```bash
   # From the project root:
   python backend/package_app.py
   ```
   *This uses PyInstaller to bundle your backend code into a single executable sidecar inside `src-tauri/binaries/`.*
2. **Run Tauri App in Dev Mode**:
   ```bash
   npx @tauri-apps/cli dev
   ```
3. **Build the Production Installer Setup (.msi / .exe)**:
   ```bash
   npx @tauri-apps/cli build
   ```
   The compiled setups will be available under:
   `src-tauri/target/release/bundle/nsis/` & `src-tauri/target/release/bundle/msi/`


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
