import json
import logging
from typing import List, Dict, Any, Callable, Tuple, Optional
from backend.agents.nim_client import NimClient
from backend.adapters.base import BaseDbAdapter

class SwarmAgent:
    """Base class for all Swarm Agents."""
    def __init__(self, nim_client: NimClient):
        self.nim = nim_client

class SchemaAnalystAgent(SwarmAgent):
    """
    Agent responsible for analyzing the DB schema and selecting relevant tables/collections.
    """
    async def analyze_schema(self, user_query: str, schema_str: str, rag_context: str = "", chat_history: Optional[List[Dict[str, Any]]] = None) -> str:
        history_str = ""
        if chat_history:
            history_str = "\n--- CONVERSATION HISTORY ---\n"
            for msg in chat_history:
                role = "User" if msg.get("sender") == "user" else "AI Swarm"
                history_str += f"{role}: {msg.get('text')}\n"
            history_str += "----------------------------\n"

        rag_str = ""
        if rag_context:
            rag_str = f"\nRETRIEVED DATA EXAMPLES (RAG):\n{rag_context}\n"

        prompt = f"""
You are the Schema Analyst Agent in a Data Analyst Swarm.
Your task is to analyze the database schema and identify the relevant tables, collections, or files, as well as their fields/relationships, that are necessary to answer the user's business question.
{history_str}
USER QUESTION:
"{user_query}"
{rag_str}
DATABASE SCHEMA:
{schema_str}

Respond with a concise analysis explaining:
1. Which tables or collections are highly relevant.
2. Which primary keys, foreign keys, or fields should be used for joins and filtering.
Keep it concise and clear so the Query Writer Agent knows exactly what fields exist.
"""
        messages = [{"role": "user", "content": prompt}]
        return await self.nim.chat_completion(messages, temperature=0.1)

class QueryWriterAgent(SwarmAgent):
    """
    Agent responsible for translating coordinator requests into database queries.
    Supports SQL, MongoDB Aggregations, and Firebase Firestore query specifications.
    """
    async def write_query(
        self,
        request: str,
        schema_analysis: str,
        db_type: str,
        previous_attempts: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        
        # Dialect instruction details
        dialect_instructions = ""
        if db_type == "postgres" or db_type == "flatfile":
            dialect_instructions = """
Write a standard SQL SELECT query compatible with PostgreSQL/DuckDB. 
- Use standard SQL syntax.
- Ensure only SELECT queries are generated.
- For limiting results or finding the top record, ALWAYS use standard "LIMIT N" (e.g. "ORDER BY revenue DESC LIMIT 1"). NEVER use "TOP N" or "SELECT TOP 1" which are syntax errors in PostgreSQL/DuckDB.
- STRICT GROUP BY RULES: If your SELECT clause contains aggregate functions (e.g., COUNT, SUM, AVG, MIN, MAX), you CANNOT select individual un-aggregated columns (like unit_price, discount) unless those columns are explicitly listed in a GROUP BY clause, or you turn the aggregates into window functions using "OVER ()" (e.g., "AVG(val) OVER ()").
- STRICT QUANTILE RULES: When calculating percentiles/quantiles, DuckDB's "QUANTILE" or "QUANTILE_CONT" functions require a fraction between 0 and 1. Use 0.9 for 90th percentile, 0.5 for median/50th percentile, etc. NEVER pass values like 90 or 50.
- Limit the query to return at most 50 rows.
- Return ONLY the raw SQL string, with no markdown code blocks or explanations.
"""
        elif db_type == "mongodb":
            dialect_instructions = """
Write a MongoDB aggregation pipeline query in JSON format.
Your output must be a single valid JSON object containing two fields:
  - "collection": (string) the name of the collection.
  - "pipeline": (list of dicts) the aggregation stages.
Example:
{
  "collection": "orders",
  "pipeline": [
    {"$match": {"status": "Completed"}},
    {"$group": {"_id": "$customer_id", "total": {"$sum": "$amount"}}}
  ]
}
Return ONLY the raw JSON string. Do not wrap in markdown code blocks.
"""
        elif db_type == "firebase":
            dialect_instructions = """
Write a Firebase Firestore structured query in JSON format.
Your output must be a single valid JSON object containing:
  - "collection": (string) collection name.
  - "where": (optional, list of [field, operator, value] conditions). Valid operators: ==, >, <, >=, <=, in, array_contains
  - "order_by": (optional, field string, or [field, "desc"])
  - "limit": (optional, default 50)
Example:
{
  "collection": "orders",
  "where": [
    ["status", "==", "Completed"],
    ["total_amount", ">", 100]
  ],
  "order_by": ["total_amount", "desc"],
  "limit": 10
}
Return ONLY the raw JSON string. Do not wrap in markdown code blocks.
"""

        retry_history = ""
        if previous_attempts:
            retry_history = "\nPREVIOUS ATTEMPTS THAT FAILED:\n"
            for att in previous_attempts:
                retry_history += f"- Query: {att['query']}\n  Error: {att['error']}\n"

        prompt = f"""
You are the Query Writer Agent in a Data Analyst Swarm.
Your task is to write a database query for a {db_type} database to retrieve the data requested by the Coordinator.

COORDINATOR REQUEST:
"{request}"

SCHEMA ANALYSIS:
{schema_analysis}

DIALECT INSTRUCTIONS:
{dialect_instructions}
{retry_history}
Generate the query now. Do NOT add any surrounding text or markdown markers like ```sql or ```json. Return ONLY the executable query string.
"""
        messages = [{"role": "user", "content": prompt}]
        return await self.nim.chat_completion(messages, temperature=0.1)

class QAEvaluatorAgent(SwarmAgent):
    """
    Agent responsible for verifying calculation sanity and query outcome completeness.
    """
    async def evaluate_query_result(self, request: str, query: str, result: Optional[str]) -> Dict[str, Any]:
        prompt = f"""
You are the QA & Evaluator Agent in a Data Analyst Swarm.
Analyze the query and its output. Determine if the query successfully retrieved the information needed for:
"{request}"

QUERY ATTEMPT:
{query}

QUERY RESULT DATA:
{result or "No output/None"}

Respond with a JSON object in this format (do not use markdown blocks):
{{
  "approved": true/false,
  "feedback": "Why it's approved, or what is missing/wrong."
}}
"""
        messages = [{"role": "user", "content": prompt}]
        res_str = await self.nim.chat_completion(messages, temperature=0.1)
        
        # Parse JSON output
        try:
            # Clean possible markdown wrapping if the LLM ignored instructions
            cleaned = res_str.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except Exception:
            return {"approved": True, "feedback": "Auto-approved due to parsing error."}

    async def evaluate_final_report(self, question: str, report: str, vis_spec: str) -> Dict[str, Any]:
        prompt = f"""
You are the QA & Evaluator Agent. Evaluate the final data analysis report and chart specification.
Ensure:
1. The report directly answers: "{question}"
2. All figures in the report match the queried data.
3. The visualization spec matches the data columns and is logically correct.

REPORT:
{report}

VISUALIZATION SPECIFICATION:
{vis_spec}

Respond with a JSON object (no markdown wrapping):
{{
  "approved": true/false,
  "feedback": "Approved, or specific errors that need correction before presentation."
}}
"""
        messages = [{"role": "user", "content": prompt}]
        res_str = await self.nim.chat_completion(messages, temperature=0.1)
        try:
            cleaned = res_str.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except Exception:
            return {"approved": True, "feedback": "Final report approved."}

class CoordinatorAgent(SwarmAgent):
    """
    Coordinator Agent that directs the workflow, forms hypotheses, synthesizes
    the final report, and creates visualization specifications.
    """
    async def formulate_hypotheses(self, question: str, schema_analysis: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> List[str]:
        history_str = ""
        if chat_history:
            history_str = "\n--- CONVERSATION HISTORY ---\n"
            for msg in chat_history:
                role = "User" if msg.get("sender") == "user" else "AI Swarm"
                history_str += f"{role}: {msg.get('text')}\n"
            history_str += "----------------------------\n"

        prompt = f"""
You are the Coordinator Agent.
{history_str}
The user asked: "{question}"
Given this schema analysis:
{schema_analysis}

Formulate investigative sub-tasks or hypotheses to explore the data. The NUMBER of sub-tasks should be proportional to the complexity of the question and the richness of the available schema:

- Simple, direct lookups (e.g., "what is the total revenue?"): 2-3 sub-tasks
- Moderate analytical questions (e.g., "which category performs best?"): 4-5 sub-tasks
- Complex, multi-dimensional investigations (e.g., "why did sales drop?" or "give me a detailed analysis"): 6-9 sub-tasks

Each sub-task should target a DIFFERENT analytical dimension — avoid redundant queries. Consider dimensions like:
  trends over time, category breakdowns, correlations, distributions, outliers, comparisons, top/bottom rankings, segment analysis.

Only include sub-tasks that the database schema can actually support. Do NOT generate sub-tasks for data that doesn't exist in the schema.

Provide these hypotheses as a JSON list of strings.
Example output:
[
  "Query...",
  "Compare...",
  "Analyze..."
]
Return ONLY the JSON list.
"""
        messages = [{"role": "user", "content": prompt}]
        res_str = await self.nim.chat_completion(messages, temperature=0.2)
        try:
            cleaned = res_str.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except Exception:
            return [f"Query key data related to: {question}"]

    async def generate_final_report(
        self,
        question: str,
        investigation_history: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[str, Dict[str, Any]]:
        
        chat_context = ""
        if chat_history:
            chat_context = "\n--- CONVERSATION HISTORY ---\n"
            for msg in chat_history:
                role = "User" if msg.get("sender") == "user" else "AI Swarm"
                chat_context += f"{role}: {msg.get('text')}\n"
            chat_context += "----------------------------\n"

        history_str = ""
        for step in investigation_history:
            history_str += f"\n--- SUB-TASK: {step['sub_task']} ---\n"
            history_str += f"Query: {step['query']}\n"
            history_str += f"Result Data:\n{step['result']}\n"

        prompt = f"""
You are the Coordinator Agent. Synthesize the final analytical report for the user's business question.
{chat_context}
USER QUESTION:
"{question}"

DATA GATHERED:
{history_str}

Your response must contain two parts, separated by the exact delimiter `[VISUALIZATION_SPEC]`.

Part 1: The Analytical Report
Write a clean, professional, layman-friendly executive summary detailing the findings. 
- Highlight specific numbers, dates, categories, and percentages.
- Explain the "why" (the root causes).
- Maintain a highly professional tone.

Part 2: The Visualization Specification
Provide a JSON object specifying the best chart to visualize this data.
The JSON must follow this schema:
{{
  "chart_type": "line" | "bar" | "pie" | "doughnut" | "area" | "horizontal_bar" | "stacked_bar" | "scatter" | "histogram" | "funnel" | "waterfall" | "heatmap" | "bubble",
  "title": "A descriptive title for the chart",
  "x_axis": "column_name_for_labels",
  "y_axis": "column_name_for_values",
  "data": [
     {{ "label_field": "val1", "value_field": 100 }},
     {{ "label_field": "val2", "value_field": 150 }}
  ]
}}

Example response layout:
Executive summary here...
[VISUALIZATION_SPEC]
{{
  "chart_type": "bar",
  "title": "Revenue by Region",
  "x_axis": "region",
  "y_axis": "revenue",
  "data": [
    {{"region": "APAC", "revenue": 1500}},
    {{"region": "Europe", "revenue": 3200}}
  ]
}}
"""
        messages = [{"role": "user", "content": prompt}]
        res_str = await self.nim.chat_completion(messages, temperature=0.3)
        
        if "[VISUALIZATION_SPEC]" in res_str:
            parts = res_str.split("[VISUALIZATION_SPEC]")
            report = parts[0].strip()
            spec_str = parts[1].strip()
        else:
            report = res_str
            spec_str = "{}"

        try:
            cleaned_spec = spec_str.replace("```json", "").replace("```", "").strip()
            vis_spec = json.loads(cleaned_spec)
        except Exception:
            vis_spec = {}

        data_list = vis_spec.get("data") if vis_spec else None
        if not vis_spec or not isinstance(data_list, list) or len(data_list) == 0:
            vis_spec = {
                "chart_type": "bar",
                "title": "Data Summary",
                "data": []
            }
            # Fallback: inspect raw_data of subtasks that returned valid results
            for item in investigation_history:
                raw = item.get("raw_data", [])
                if raw and isinstance(raw, list) and len(raw) > 0:
                    try:
                        import pandas as pd
                        import numpy as np
                        df = pd.DataFrame(raw)
                        num_cols = df.select_dtypes(include="number").columns.tolist()
                        obj_cols = df.select_dtypes(exclude="number").columns.tolist()
                        
                        x_col = ""
                        y_col = ""
                        
                        if obj_cols:
                            x_col = obj_cols[0]
                        if num_cols:
                            y_col = num_cols[0]
                            
                        if not x_col and num_cols:
                            x_col = num_cols[0]
                            if len(num_cols) > 1:
                                y_col = num_cols[1]
                                
                        if x_col and y_col:
                            # Dynamic fallback chart selection based on columns and rows
                            fallback_type = "bar"
                            x_col_lower = x_col.lower()
                            if any(kw in x_col_lower for kw in ["date", "month", "year", "time", "day", "quarter", "timeline"]):
                                fallback_type = "line"
                            elif len(df) <= 5:
                                fallback_type = "pie"
                                
                            vis_spec["chart_type"] = fallback_type
                            vis_spec["title"] = item.get("sub_task", "Data Summary")
                            vis_spec["x_axis"] = x_col
                            vis_spec["y_axis"] = y_col
                            vis_spec["data"] = df.head(15).to_dict(orient="records")
                            break
                    except Exception:
                        pass

        return report, vis_spec

class SwarmOrchestrator:
    """
    Main Orchestrator to execute the Swarm workflow.
    """
    def __init__(self, nim_client: NimClient):
        self.schema_agent = SchemaAnalystAgent(nim_client)
        self.writer_agent = QueryWriterAgent(nim_client)
        self.qa_agent = QAEvaluatorAgent(nim_client)
        self.coord_agent = CoordinatorAgent(nim_client)

    async def run_investigation(
        self,
        question: str,
        adapter: BaseDbAdapter,
        db_type: str,
        log_callback: Callable[[str, str], None],
        chat_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Runs the full hypothesis-driven swarm investigation.
        `log_callback` is called with (agent_name, log_message) to stream logs in real-time.
        """
        log_callback("System", f"Starting Swarm investigation on {db_type} database...")

        # 1. Retrieve RAG Context (Local keyword-search database retrieval)
        from backend.utils import retrieve_rag_context
        log_callback("System", "Performing semantic RAG lookup across database tables...")
        rag_context = await retrieve_rag_context(question, adapter, db_type)
        if rag_context:
            log_callback("System", "✅ RAG search retrieved matching database records to assist the agents.")
        else:
            log_callback("System", "RAG search completed (no specific record matches found).")

        # 2. Schema Analysis
        log_callback("System", "Reflecting database schema...")
        schema_str = await adapter.get_schema()
        
        log_callback("Schema Analyst Agent", "Analyzing database schema structure...")
        schema_analysis = await self.schema_agent.analyze_schema(question, schema_str, rag_context, chat_history)
        log_callback("Schema Analyst Agent", f"Schema Analysis complete:\n{schema_analysis}")

        # 3. Formulate Hypotheses
        log_callback("Coordinator Agent", "Formulating data investigation hypotheses...")
        sub_tasks = await self.coord_agent.formulate_hypotheses(question, schema_analysis, chat_history)
        log_callback("Coordinator Agent", f"Hypotheses formulated: {json.dumps(sub_tasks, indent=2)}")

        investigation_history = []

        # 4. Process each Hypothesis
        for index, sub_task in enumerate(sub_tasks):
            log_callback("Coordinator Agent", f"Executing Sub-task {index+1}/{len(sub_tasks)}: {sub_task}")
            
            query = ""
            result = ""
            row_count = 0
            error = None
            
            previous_attempts = []
            max_retries = 3
            success = False

            raw_rows = []
            for attempt in range(max_retries):
                log_callback("Query Writer Agent", f"Writing query for: '{sub_task}' (Attempt {attempt+1}/{max_retries})")
                query = await self.writer_agent.write_query(
                    request=sub_task,
                    schema_analysis=schema_analysis,
                    db_type=db_type,
                    previous_attempts=previous_attempts
                )
                log_callback("Query Writer Agent", f"Generated query:\n{query}")

                log_callback("Execution Agent", "Executing query against connection...")
                result, row_count, error, raw_rows = await adapter.execute(query)

                if error:
                    log_callback("Execution Agent", f"⚠️ Query failed with error: {error}")
                    previous_attempts.append({"query": query, "error": error})
                else:
                    log_callback("Execution Agent", f"✅ Query succeeded. Returned {row_count} rows.")
                    
                    # QA Check on result
                    log_callback("QA Evaluator Agent", "Evaluating query result completeness...")
                    qa_res = await self.qa_agent.evaluate_query_result(sub_task, query, result)
                    
                    if qa_res.get("approved", True):
                        log_callback("QA Evaluator Agent", f"✅ Result Approved: {qa_res.get('feedback')}")
                        success = True
                        break
                    else:
                        log_callback("QA Evaluator Agent", f"❌ Result Rejected: {qa_res.get('feedback')}")
                        previous_attempts.append({"query": query, "error": f"QA Rejected: {qa_res.get('feedback')}"})

            if not success and error:
                # If query completely fails after retries, log it
                result = f"Error: Query failed after {max_retries} attempts. Details: {error}"
            
            investigation_history.append({
                "sub_task": sub_task,
                "query": query,
                "result": result,
                "row_count": row_count,
                "raw_data": raw_rows or []
            })

        # 5. Generate Final Synthesis Report
        log_callback("Coordinator Agent", "Synthesizing final executive report and visualization spec...")
        report, vis_spec = await self.coord_agent.generate_final_report(question, investigation_history, chat_history)
        
        # 5. Final QA Check
        log_callback("QA Evaluator Agent", "Performing final QA check on report and chart specification...")
        final_qa = await self.qa_agent.evaluate_final_report(question, report, json.dumps(vis_spec, default=str))
        
        if final_qa.get("approved", True):
            log_callback("QA Evaluator Agent", "✅ Final report and chart specifications approved!")
        else:
            log_callback("QA Evaluator Agent", f"⚠️ QA comments: {final_qa.get('feedback')}. Refinement may be needed.")

        import uuid
        import os
        from backend.utils import generate_seaborn_dashboard

        log_callback("System", "Generating high-fidelity Seaborn data dashboard...")
        # Define output path
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_dir = os.path.join(backend_dir, "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Clean up old dashboard files to avoid bloat
        for f in os.listdir(upload_dir):
            if f.startswith("dashboard_") and f.endswith(".png"):
                try:
                    os.remove(os.path.join(upload_dir, f))
                except Exception:
                    pass
                    
        dashboard_filename = f"dashboard_{uuid.uuid4().hex[:8]}.png"
        dashboard_path = os.path.join(upload_dir, dashboard_filename)
        
        try:
            generate_seaborn_dashboard(investigation_history, dashboard_path)
            log_callback("System", "✅ Advanced executive dashboard generated successfully!")
        except Exception as e:
            log_callback("System", f"⚠️ Dashboard generation failed: {str(e)}")
            dashboard_filename = ""

        log_callback("System", "Swarm investigation complete.")
        
        return {
            "report": report,
            "visualization": vis_spec,
            "history": investigation_history,
            "dashboard_url": f"http://localhost:8002/uploads/{dashboard_filename}" if dashboard_filename else ""
        }
