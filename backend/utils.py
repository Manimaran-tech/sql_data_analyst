from typing import List, Dict, Any, Tuple, Optional
import pandas as pd

def format_ascii_table(rows: List[Dict[str, Any]], max_rows: int = 50) -> Tuple[Optional[str], int]:
    """
    Format a list of dicts (rows) into a clean ASCII table.
    Returns (table_string, row_count).
    """
    if not rows:
        return "(empty result)", 0

    total_fetched = len(rows)
    truncated = total_fetched > max_rows
    if truncated:
        rows = rows[:max_rows]

    columns = list(rows[0].keys())
    
    # Calculate column widths
    col_widths = [len(c) for c in columns]
    for row in rows:
        for i, col in enumerate(columns):
            val = row.get(col)
            val_str = str(val) if val is not None else "NULL"
            col_widths[i] = max(col_widths[i], len(val_str))

    # Cap column width
    col_widths = [min(w, 40) for w in col_widths]

    def fmt(val, width):
        s = str(val) if val is not None else "NULL"
        if len(s) > width:
            s = s[:width - 3] + "..."
        return s.ljust(width)

    header = " | ".join(fmt(c, col_widths[i]) for i, c in enumerate(columns))
    separator = "-+-".join("-" * w for w in col_widths)
    data_rows = [
        " | ".join(fmt(row.get(col), col_widths[i]) for i, col in enumerate(columns))
        for row in rows
    ]

    table = header + "\n" + separator + "\n" + "\n".join(data_rows)
    if truncated:
        table += f"\n... (showing {max_rows} of {total_fetched} rows)"

    return table, len(rows)

def generate_seaborn_dashboard(history: List[Dict[str, Any]], output_path: str):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import seaborn as sns
    import numpy as np
    from matplotlib.patches import FancyBboxPatch

    # Filter out subtasks that returned valid data
    plots_data = []
    for item in history:
        raw = item.get("raw_data", [])
        if raw and isinstance(raw, list) and len(raw) > 0:
            plots_data.append(item)

    if not plots_data:
        # Generate an empty "No Data" placeholder dashboard
        fig, ax = plt.subplots(figsize=(8, 6))
        ax.text(0.5, 0.5, "No visual data returned during swarm execution.", 
                ha='center', va='center', fontsize=14, color='#64748b', fontfamily='sans-serif')
        ax.axis('off')
        plt.tight_layout()
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        return

    # Calculate stats for the KPI card panel
    total_records = sum(len(item.get("raw_data", [])) for item in plots_data)
    kpi_metric_label = "Metric Sum"
    kpi_metric_val = 0.0
    kpi_metric_str = "0"
    found_metric = False
    
    for item in plots_data:
        df = pd.DataFrame(item.get("raw_data", []))
        if df.empty:
            continue
        num_cols = df.select_dtypes(include="number").columns.tolist()
        if num_cols:
            val_col = num_cols[0]
            # Prioritize columns that sound like sales or revenue
            for col in num_cols:
                if any(kw in col.lower() for kw in ['sales', 'revenue', 'amount', 'total', 'quantity', 'price']):
                    val_col = col
                    break
            kpi_metric_label = val_col.replace('_', ' ').title()
            kpi_metric_val = float(df[val_col].sum())  # type: ignore
            found_metric = True
            break
            
    if found_metric:
        if any(kw in kpi_metric_label.lower() for kw in ['sales', 'revenue', 'amount', 'price']):
            if kpi_metric_val >= 1_000_000:
                kpi_metric_str = f"${kpi_metric_val/1_000_000:.2f}M"
            elif kpi_metric_val >= 1_000:
                kpi_metric_str = f"${kpi_metric_val/1_000:.1f}k"
            else:
                kpi_metric_str = f"${kpi_metric_val:,.2f}"
        else:
            if kpi_metric_val >= 1_000_000:
                kpi_metric_str = f"{kpi_metric_val/1_000_000:.2f}M"
            elif kpi_metric_val >= 1_000:
                kpi_metric_str = f"{kpi_metric_val/1_000:.1f}k"
            else:
                kpi_metric_str = f"{kpi_metric_val:,.2f}" if not kpi_metric_val.is_integer() else f"{int(kpi_metric_val):,}"
    else:
        kpi_metric_label = "Queries Completed"
        kpi_metric_str = f"{len(plots_data)} runs"

    # Set styles
    sns.set_theme(style="whitegrid")
    colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"]
    
    n_plots = len(plots_data)
    # Determine dynamic grid: up to 3 columns, rows scale with count
    if n_plots <= 0:
        n_cols = 1
        n_rows = 1
    elif n_plots <= 2:
        n_cols = 2
        n_rows = 1
    elif n_plots <= 4:
        n_cols = 2
        n_rows = 2
    elif n_plots <= 6:
        n_cols = 3
        n_rows = 2
    else:
        n_cols = 3
        n_rows = 3

    # Cap to 9 max
    max_plots = min(n_plots, 9)

    # Calculate figure height dynamically
    row_height = 3.8
    kpi_height = 1.2
    fig_height = kpi_height + (n_rows * row_height) + 1.0
    fig = plt.figure(figsize=(14, fig_height), facecolor='#f8fafc')

    # Grid: 1 row for KPI + n_rows for charts
    height_ratios = [0.5] + [2] * n_rows
    gs = fig.add_gridspec(1 + n_rows, n_cols, height_ratios=height_ratios, hspace=0.35, wspace=0.3)

    # 1. Add KPI row axes at the top (spans all columns)
    ax_kpis = fig.add_subplot(gs[0, :])
    ax_kpis.axis('off')
    ax_kpis.set_facecolor('#f8fafc')

    # Draw KPI cards using FancyBboxPatch and text layers
    card_configs = [
        {
            "x": 0.01, "w": 0.30,
            "title": "TOTAL RECORDS PROCESSED",
            "value": f"{total_records:,} Rows",
            "subtext": "Across all swarm sub-queries",
            "color": "#3b82f6"
        },
        {
            "x": 0.35, "w": 0.30,
            "title": f"PRIMARY METRIC: {kpi_metric_label.upper()}",
            "value": kpi_metric_str,
            "subtext": "Aggregated sum value",
            "color": "#10b981"
        },
        {
            "x": 0.69, "w": 0.30,
            "title": "SWARM AGENT ORCHESTRATION",
            "value": "QA Approved",
            "subtext": f"{len(history)} Agents active, 0 errors",
            "color": "#8b5cf6"
        }
    ]
    
    for card in card_configs:
        cx = float(card["x"])
        cw = float(card["w"])
        ctitle = str(card["title"])
        cvalue = str(card["value"])
        csubtext = str(card["subtext"])
        ccolor = str(card["color"])

        # Draw the card background
        box = FancyBboxPatch(
            (cx, 0.05), cw, 0.90,
            boxstyle="round,pad=0.01,rounding_size=0.02",
            facecolor='white',
            edgecolor='#e2e8f0',
            linewidth=1,
            transform=ax_kpis.transAxes,
            zorder=1
        )
        ax_kpis.add_patch(box)
        
        # Draw the colored sidebar indicator line inside the card
        bar = FancyBboxPatch(
            (cx + 0.002, 0.08), 0.006, 0.84,
            boxstyle="round,pad=0.001,rounding_size=0.003",
            facecolor=ccolor,
            edgecolor='none',
            transform=ax_kpis.transAxes,
            zorder=2
        )
        ax_kpis.add_patch(bar)
        
        # Add text layers
        ax_kpis.text(
            cx + 0.015, 0.72,
            ctitle,
            transform=ax_kpis.transAxes,
            fontsize=8.5,
            fontweight='bold',
            color='#64748b',
            fontfamily='sans-serif',
            zorder=3
        )
        ax_kpis.text(
            cx + 0.015, 0.42,
            cvalue,
            transform=ax_kpis.transAxes,
            fontsize=15,
            fontweight='bold',
            color='#0f172a',
            fontfamily='sans-serif',
            zorder=3
        )
        ax_kpis.text(
            cx + 0.015, 0.18,
            csubtext,
            transform=ax_kpis.transAxes,
            fontsize=8,
            color='#94a3b8',
            fontfamily='sans-serif',
            zorder=3
        )

    # 2. Draw actual plots inside dynamic grid slots
    for idx in range(max_plots):
        item = plots_data[idx]
        row_idx = idx // n_cols  # which chart row (0-based)
        col_idx = idx % n_cols   # which column
        ax = fig.add_subplot(gs[1 + row_idx, col_idx])
        
        # Style subplot container
        ax.set_facecolor('white')
        for spine in ax.spines.values():
            spine.set_edgecolor('#e2e8f0')
            spine.set_linewidth(1)

        sub_task = item.get("sub_task", "Query Result")
        raw = item.get("raw_data", [])
        df = pd.DataFrame(raw)
        
        # Identify numeric vs non-numeric columns
        num_cols = df.select_dtypes(include="number").columns.tolist()
        obj_cols = df.select_dtypes(exclude="number").columns.tolist()
        
        # Try to find a date column
        date_col = None
        for col in df.columns:
            col_lower = col.lower()
            if 'date' in col_lower or 'month' in col_lower or 'year' in col_lower:
                date_col = col
                break

        title = sub_task
        if len(title) > 55:
            title = title[:52] + "..."

        try:
            # Helper: truncate long category labels for readability
            def truncate_labels(series, max_len=12):
                return series.astype(str).apply(lambda x: x[:max_len] + '…' if len(str(x)) > max_len else x)

            if date_col and num_cols:
                # Time Series Trend line with filled area
                y_col = num_cols[0]
                try:
                    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
                    df = df.sort_values(by=date_col)
                except Exception:
                    pass
                ax.plot(df[date_col].to_numpy(), df[y_col].to_numpy(), marker="o", color=colors[idx % len(colors)], linewidth=2.5, markersize=4)
                ax.fill_between(df[date_col].to_numpy(), df[y_col].to_numpy(), alpha=0.15, color=colors[idx % len(colors)])
                ax.set_title(title, fontsize=10, fontweight='bold', pad=10, color='#1e293b')
                ax.tick_params(axis='x', rotation=30, labelsize=7)
            elif len(obj_cols) > 0 and len(num_cols) > 0:
                # Categorical bar plot — limit to 8 bars, truncate labels
                cat_col = obj_cols[0]
                val_col = num_cols[0]
                plot_df = df.head(8).copy()
                plot_df[cat_col] = truncate_labels(plot_df[cat_col])
                
                sns.barplot(data=plot_df, x=cat_col, y=val_col, ax=ax, color=colors[idx % len(colors)])  # type: ignore
                ax.set_title(title, fontsize=10, fontweight='bold', pad=10, color='#1e293b')
                ax.tick_params(axis='x', rotation=40, labelsize=7)
                # Align rotated labels to the right for cleaner look
                for label in ax.get_xticklabels():
                    label.set_horizontalalignment('right')
            elif len(num_cols) >= 2:
                # Scatter correlation
                sns.scatterplot(data=df, x=num_cols[0], y=num_cols[1], s=80, color=colors[idx % len(colors)], ax=ax)  # type: ignore
                ax.set_title(title, fontsize=10, fontweight='bold', pad=10, color='#1e293b')
            elif len(num_cols) == 1:
                # Histogram
                sns.histplot(data=df, x=num_cols[0], kde=True, ax=ax, color=colors[idx % len(colors)])  # type: ignore
                ax.set_title(title, fontsize=10, fontweight='bold', pad=10, color='#1e293b')
            else:
                ax.text(0.5, 0.5, f"Data size: {len(df)} rows\nColumns: {', '.join(df.columns)}", 
                        ha='center', va='center', fontsize=10)
                ax.set_title(title, fontsize=10, fontweight='bold', pad=10)
        except Exception as plot_err:
            ax.text(0.5, 0.5, f"Plotting error: {plot_err}", ha='center', va='center', fontsize=10)
            ax.set_title(title, fontsize=10, fontweight='bold', pad=10)

        # Style labels and axes ticks
        ax.set_xlabel(ax.get_xlabel().replace('_', ' ').title(), fontsize=8, fontweight='bold', color='#475569')
        ax.set_ylabel(ax.get_ylabel().replace('_', ' ').title(), fontsize=8, fontweight='bold', color='#475569')
        ax.tick_params(labelsize=7, colors='#64748b')
        ax.grid(True, linestyle='--', alpha=0.4, color='#cbd5e1')

    # Hide unused grid slots
    total_slots = n_rows * n_cols
    for idx in range(max_plots, total_slots):
        row_idx = idx // n_cols
        col_idx = idx % n_cols
        ax = fig.add_subplot(gs[1 + row_idx, col_idx])
        ax.axis('off')

    plt.suptitle("SWARM ANALYST INVESTIGATION DASHBOARD", fontsize=15, fontweight='bold', color='#0f172a', y=0.98)
    plt.tight_layout(rect=(0.0, 0.0, 1.0, 0.96))
    plt.savefig(output_path, dpi=180, bbox_inches='tight')
    plt.close()

def clean_query_string(query: str) -> str:
    """
    Remove markdown code block wraps (```sql or ```json) and surrounding backticks from queries.
    """
    q = query.strip()
    if q.startswith("```"):
        lines = q.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        q = "\n".join(lines).strip()
    if q.startswith("`") and q.endswith("`"):
        q = q[1:-1].strip()
    return q

async def retrieve_rag_context(query: str, adapter: Any, db_type: str) -> str:
    """
    Perform a local keyword-based search (RAG) across text columns in all tables.
    Returns a formatted text representation of matching database records.
    """
    import json
    from typing import Any
    
    # 1. Parse keywords (stop words filter)
    stop_words = {
        "why", "the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "by", "with",
        "about", "against", "between", "into", "through", "during", "before", "after",
        "above", "below", "from", "up", "down", "in", "out", "over", "under", "again",
        "further", "then", "once", "here", "there", "when", "where", "why", "how",
        "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
        "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s",
        "t", "can", "will", "just", "don", "should", "now", "select", "where", "from",
        "show", "what", "did", "drop", "sales", "revenue", "dataset", "database",
        "query", "analyze", "find", "get", "compare", "list", "table", "chart", "graph"
    }
    
    words = [w.strip("?,.!:;()\"'") for w in query.lower().split()]
    keywords = [w for w in words if len(w) >= 3 and w not in stop_words]
    
    if not keywords:
        return ""
        
    try:
        # Get schema to find tables and columns
        schema_str = await adapter.get_schema()
        
        # Parse schema for tables and their text columns
        tables_text_cols = {}
        current_table = None
        for line in schema_str.splitlines():
            line = line.strip()
            if not line:
                continue
            if "📊" in line or "🗂️" in line:
                parts = line.split()
                for part in parts:
                    part_clean = part.strip("📊🗂️()")
                    if part_clean and not part_clean.isdigit() and part_clean != "rows" and part_clean != "documents":
                        current_table = part_clean
                        tables_text_cols[current_table] = []
                        break
            elif line.startswith("---") or line.startswith("==="):
                continue
            elif current_table is not None:
                parts = line.split()
                if len(parts) >= 2:
                    col_name = parts[0]
                    col_type = parts[1].lower()
                    # Check if it's a text/string column
                    if any(t in col_type for t in ["varchar", "text", "string", "char", "object", "str"]):
                        tables_text_cols[current_table].append(col_name)
                        
        if not tables_text_cols:
            return ""
            
        rag_lines = ["\n--- RETRIEVED DATABASE RECORDS (RAG CONTEXT) ---"]
        records_found = 0
        
        for table, text_cols in tables_text_cols.items():
            if records_found >= 10:  # limit total retrieved records
                break
                
            rows = []
            if db_type in ("postgres", "flatfile"):
                # Build SQL wildcard search
                clauses = []
                cols_to_search = text_cols if text_cols else list(tables_text_cols[table])[:3]
                for col in cols_to_search:
                    for kw in keywords:
                        clauses.append(f"LOWER(\"{col}\") LIKE '%{kw.lower()}%'")
                if clauses:
                    sql = f"SELECT * FROM \"{table}\" WHERE {' OR '.join(clauses)} LIMIT 3"
                    _, _, _, rows = await adapter.execute(sql)
            elif db_type == "mongodb":
                match_conditions = []
                cols_to_search = text_cols if text_cols else ["name", "category", "description"][:3]
                for col in cols_to_search:
                    for kw in keywords:
                        match_conditions.append({col: {"$regex": kw, "$options": "i"}})
                if match_conditions:
                    pipeline = [
                        {"$match": {"$or": match_conditions}},
                        {"$limit": 3}
                    ]
                    mongo_query = json.dumps({"collection": table, "pipeline": pipeline})
                    _, _, _, rows = await adapter.execute(mongo_query)
            elif db_type == "firebase":
                firebase_query = json.dumps({"collection": table, "limit": 3})
                _, _, _, rows = await adapter.execute(firebase_query)
                
            if rows:
                rag_lines.append(f"Table/Collection: {table}")
                for idx, r in enumerate(rows):
                    cleaned_r = {k: v for k, v in r.items() if not k.startswith('_')}
                    rag_lines.append(f"  Record {idx+1}: {json.dumps(cleaned_r, default=str)}")
                    records_found += 1
                    
        if records_found > 0:
            rag_lines.append("------------------------------------------------\n")
            return "\n".join(rag_lines)
            
    except Exception as e:
        print(f"RAG search error: {str(e)}")
        
    return ""
