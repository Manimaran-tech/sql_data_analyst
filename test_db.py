"""Quick database verification script — no openenv needed."""
import importlib.util, sys

# Load database module directly (bypassing server/__init__.py which needs openenv)
spec = importlib.util.spec_from_file_location("database", "server/database.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

db = mod.create_database()

# Print schema
schema = mod.get_schema_string(db)
print(schema[:800])
print("\n" + "=" * 50)

# Row counts
tables = ["customers", "products", "suppliers", "orders", "order_items", "shipments", "returns", "reviews"]
for t in tables:
    r, c, e = mod.execute_query(db, "SELECT COUNT(*) as cnt FROM " + t)
    print(r)

# Verify anomalies
print("\n=== ANOMALY CHECKS ===")

# Q3 2025 vs Q2 2025 revenue
r, c, e = mod.execute_query(db, """
    SELECT 
        CASE 
            WHEN o.order_date BETWEEN '2025-04-01' AND '2025-06-30' THEN 'Q2_2025'
            WHEN o.order_date BETWEEN '2025-07-01' AND '2025-09-30' THEN 'Q3_2025'
        END as quarter,
        SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE quarter IS NOT NULL
    GROUP BY quarter
""")
print("\nQ2 vs Q3 2025 Revenue:")
print(r)

# Electronics returns
r, c, e = mod.execute_query(db, """
    SELECT p.category, COUNT(ret.return_id) as returns, 
           ROUND(COUNT(ret.return_id) * 100.0 / COUNT(DISTINCT oi.item_id), 1) as return_pct
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    LEFT JOIN returns ret ON oi.order_id = ret.order_id AND oi.product_id = ret.product_id
    GROUP BY p.category
    ORDER BY return_pct DESC
""")
print("\nReturn rates by category:")
print(r)

# Discontinue products reviews
r, c, e = mod.execute_query(db, """
    SELECT p.name, ROUND(AVG(r.rating), 2) as avg_rating, COUNT(r.review_id) as num_reviews
    FROM products p
    JOIN reviews r ON p.product_id = r.product_id
    WHERE p.name IN ('UltraBass X500', 'SmartView Tab 3', 'QuickDry Pro Jacket')
    GROUP BY p.name
""")
print("\nDiscontinue candidates - Reviews:")
print(r)

# Premium segment growth
r, c, e = mod.execute_query(db, """
    SELECT c.segment,
        SUM(CASE WHEN o.order_date BETWEEN '2024-01-01' AND '2024-12-31' THEN 1 ELSE 0 END) as orders_2024,
        SUM(CASE WHEN o.order_date BETWEEN '2025-01-01' AND '2025-12-31' THEN 1 ELSE 0 END) as orders_2025
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    GROUP BY c.segment
    ORDER BY orders_2025 DESC
""")
print("\nSegment order volumes 2024 vs 2025:")
print(r)

print("\n✅ Database verification complete!")
