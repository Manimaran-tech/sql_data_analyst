"""
E-Commerce Database — 8-table schema with deterministic seed data.

Creates an in-memory SQLite database seeded with ~5K+ rows and 
deliberately planted anomalies/patterns for the 5 investigation tasks:

1. basic_lookup:             Clear top-5 revenue products in Q4 2025
2. comparative_analysis:     Electronics has worst return rate due to "Defective" reasons
3. trend_investigation:       "Premium" segment grew fastest in 2025, driven by repeat orders
4. anomaly_diagnosis:         Q3 2025 revenue drop caused by Electronics in APAC region
5. strategic_recommendation:  3 specific products with high returns + bad reviews + low margins
"""

import sqlite3
import random
from datetime import datetime, timedelta
from typing import Optional, Tuple


# ── Constants ────────────────────────────────────────────────────────────────

REGIONS = ["North America", "Europe", "APAC", "Latin America"]
SEGMENTS = ["Budget", "Standard", "Premium", "Enterprise"]
CATEGORIES = ["Electronics", "Clothing", "Home & Garden", "Sports", "Books"]
SUBCATEGORIES = {
    "Electronics": ["Smartphones", "Laptops", "Headphones", "Tablets", "Cameras"],
    "Clothing": ["Men's Wear", "Women's Wear", "Kids", "Accessories", "Footwear"],
    "Home & Garden": ["Furniture", "Kitchen", "Decor", "Tools", "Outdoor"],
    "Sports": ["Fitness", "Team Sports", "Outdoor Gear", "Cycling", "Swimming"],
    "Books": ["Fiction", "Non-Fiction", "Technical", "Children's", "Textbooks"],
}
CARRIERS = ["FedEx", "UPS", "DHL", "USPS", "BlueDart"]
RETURN_REASONS = ["Defective", "Wrong Item", "Not as Described", "Changed Mind", "Too Late"]
COUNTRIES = ["USA", "China", "Germany", "India", "Japan", "Brazil", "UK", "South Korea"]

# Products that should be flagged for discontinuation (Task 5)
DISCONTINUE_PRODUCTS = ["UltraBass X500", "SmartView Tab 3", "QuickDry Pro Jacket"]

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
    "Anthony", "Betty", "Mark", "Margaret", "Steven", "Sandra", "Andrew", "Ashley",
    "Paul", "Dorothy", "Joshua", "Kimberly", "Kenneth", "Emily", "Kevin", "Donna",
]
LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
]

SUPPLIER_NAMES = [
    "TechWorld Inc", "FashionForward Ltd", "HomeBase Supply", "SportMax Co",
    "BookHaven Publishing", "GlobalParts Corp", "PrimeSource Industries",
    "NovaElectronics", "GreenLeaf Home", "ActiveGear LLC",
]

# Carefully designed product list — 50 products across 5 categories
PRODUCTS_DATA = [
    # Electronics (10) — includes 2 discontinue candidates
    ("iPhone Pro Max 16", "Electronics", "Smartphones", 1199.99, 0),
    ("Samsung Galaxy S26", "Electronics", "Smartphones", 999.99, 1),
    ("UltraBass X500", "Electronics", "Headphones", 299.99, 2),        # DISCONTINUE
    ("SmartView Tab 3", "Electronics", "Tablets", 449.99, 7),          # DISCONTINUE
    ("MacBook Air M4", "Electronics", "Laptops", 1299.99, 0),
    ("Sony WH-1000XM6", "Electronics", "Headphones", 349.99, 7),
    ("Canon EOS R7", "Electronics", "Cameras", 1499.99, 2),
    ("iPad Pro 2025", "Electronics", "Tablets", 1099.99, 0),
    ("Dell XPS 15", "Electronics", "Laptops", 1449.99, 1),
    ("Pixel 10", "Electronics", "Smartphones", 899.99, 1),
    # Clothing (10)
    ("Classic Oxford Shirt", "Clothing", "Men's Wear", 59.99, 3),
    ("Silk Evening Dress", "Clothing", "Women's Wear", 189.99, 3),
    ("Kids Rainbow Hoodie", "Clothing", "Kids", 34.99, 4),
    ("Leather Belt Premium", "Clothing", "Accessories", 79.99, 3),
    ("Running Sneakers V2", "Clothing", "Footwear", 129.99, 4),
    ("Wool Winter Coat", "Clothing", "Men's Wear", 249.99, 3),
    ("Summer Sundress", "Clothing", "Women's Wear", 69.99, 4),
    ("Baby Onesie Pack", "Clothing", "Kids", 24.99, 4),
    ("Designer Watch", "Clothing", "Accessories", 499.99, 3),
    ("Hiking Boots Pro", "Clothing", "Footwear", 179.99, 5),
    # Home & Garden (10)
    ("Ergonomic Office Chair", "Home & Garden", "Furniture", 399.99, 8),
    ("Chef's Knife Set", "Home & Garden", "Kitchen", 149.99, 8),
    ("Modern Table Lamp", "Home & Garden", "Decor", 89.99, 8),
    ("Cordless Drill 20V", "Home & Garden", "Tools", 119.99, 9),
    ("Garden Hose Set", "Home & Garden", "Outdoor", 49.99, 9),
    ("Standing Desk", "Home & Garden", "Furniture", 599.99, 8),
    ("Coffee Maker Pro", "Home & Garden", "Kitchen", 199.99, 9),
    ("Wall Art Canvas", "Home & Garden", "Decor", 59.99, 8),
    ("Power Wrench Kit", "Home & Garden", "Tools", 89.99, 9),
    ("Patio Umbrella", "Home & Garden", "Outdoor", 129.99, 9),
    # Sports (10) — includes 1 discontinue candidate
    ("QuickDry Pro Jacket", "Sports", "Outdoor Gear", 159.99, 5),      # DISCONTINUE
    ("Yoga Mat Premium", "Sports", "Fitness", 49.99, 5),
    ("Basketball Official", "Sports", "Team Sports", 29.99, 6),
    ("Mountain Bike X1", "Sports", "Cycling", 799.99, 6),
    ("Swim Goggles Elite", "Sports", "Swimming", 39.99, 5),
    ("Adjustable Dumbbells", "Sports", "Fitness", 249.99, 6),
    ("Soccer Ball Pro", "Sports", "Team Sports", 34.99, 5),
    ("Road Bike Carbon", "Sports", "Cycling", 1899.99, 6),
    ("Swim Cap Silicone", "Sports", "Swimming", 14.99, 5),
    ("Resistance Band Set", "Sports", "Fitness", 29.99, 6),
    # Books (10)
    ("The Last Algorithm", "Books", "Fiction", 19.99, 4),
    ("AI Revolution 2025", "Books", "Non-Fiction", 29.99, 4),
    ("Python Mastery", "Books", "Technical", 49.99, 6),
    ("Magic Forest Tales", "Books", "Children's", 12.99, 4),
    ("Data Science 101", "Books", "Textbooks", 89.99, 6),
    ("Mystery at Midnight", "Books", "Fiction", 14.99, 4),
    ("Leadership Unlocked", "Books", "Non-Fiction", 24.99, 6),
    ("Rust Programming", "Books", "Technical", 44.99, 4),
    ("Bedtime Stories", "Books", "Children's", 9.99, 6),
    ("Calculus Advanced", "Books", "Textbooks", 79.99, 6),
]


# ── Database creation ────────────────────────────────────────────────────────

def create_database(seed: int = 42) -> sqlite3.Connection:
    """Create and seed an in-memory SQLite database. Fully deterministic."""
    rng = random.Random(seed)
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # ── Schema ───────────────────────────────────────────────────────
    cur.executescript("""
        CREATE TABLE suppliers (
            supplier_id   INTEGER PRIMARY KEY,
            name          TEXT NOT NULL,
            country       TEXT NOT NULL,
            reliability_score REAL NOT NULL
        );

        CREATE TABLE customers (
            customer_id   INTEGER PRIMARY KEY,
            name          TEXT NOT NULL,
            email         TEXT NOT NULL,
            segment       TEXT NOT NULL,
            region        TEXT NOT NULL,
            join_date     TEXT NOT NULL
        );

        CREATE TABLE products (
            product_id    INTEGER PRIMARY KEY,
            name          TEXT NOT NULL,
            category      TEXT NOT NULL,
            subcategory   TEXT NOT NULL,
            unit_price    REAL NOT NULL,
            supplier_id   INTEGER NOT NULL,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        );

        CREATE TABLE orders (
            order_id      INTEGER PRIMARY KEY,
            customer_id   INTEGER NOT NULL,
            order_date    TEXT NOT NULL,
            status        TEXT NOT NULL,
            total_amount  REAL NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        );

        CREATE TABLE order_items (
            item_id       INTEGER PRIMARY KEY,
            order_id      INTEGER NOT NULL,
            product_id    INTEGER NOT NULL,
            quantity      INTEGER NOT NULL,
            unit_price    REAL NOT NULL,
            discount      REAL NOT NULL DEFAULT 0.0,
            FOREIGN KEY (order_id) REFERENCES orders(order_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        );

        CREATE TABLE shipments (
            shipment_id   INTEGER PRIMARY KEY,
            order_id      INTEGER NOT NULL,
            ship_date     TEXT NOT NULL,
            delivery_date TEXT,
            carrier       TEXT NOT NULL,
            status        TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(order_id)
        );

        CREATE TABLE returns (
            return_id     INTEGER PRIMARY KEY,
            order_id      INTEGER NOT NULL,
            product_id    INTEGER NOT NULL,
            reason        TEXT NOT NULL,
            return_date   TEXT NOT NULL,
            refund_amount REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(order_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        );

        CREATE TABLE reviews (
            review_id     INTEGER PRIMARY KEY,
            product_id    INTEGER NOT NULL,
            customer_id   INTEGER NOT NULL,
            rating        INTEGER NOT NULL,
            review_text   TEXT NOT NULL,
            review_date   TEXT NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(product_id),
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        );
    """)

    # ── Suppliers (10) ───────────────────────────────────────────────
    for i, name in enumerate(SUPPLIER_NAMES):
        country = COUNTRIES[i % len(COUNTRIES)]
        reliability = round(rng.uniform(0.6, 1.0), 2)
        cur.execute(
            "INSERT INTO suppliers VALUES (?, ?, ?, ?)",
            (i, name, country, reliability),
        )

    # ── Products (50) ────────────────────────────────────────────────
    for i, (name, cat, subcat, price, sup_id) in enumerate(PRODUCTS_DATA):
        cur.execute(
            "INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)",
            (i, name, cat, subcat, price, sup_id),
        )

    # ── Customers (500) ──────────────────────────────────────────────
    base_date = datetime(2023, 1, 1)
    for i in range(500):
        first = rng.choice(FIRST_NAMES)
        last = rng.choice(LAST_NAMES)
        name = f"{first} {last}"
        email = f"{first.lower()}.{last.lower()}{i}@email.com"
        # Bias: more Premium customers join later (for trend task)
        if i >= 400:
            segment = "Premium"
            join_date = base_date + timedelta(days=rng.randint(500, 730))
        elif i >= 350:
            segment = "Enterprise"
            join_date = base_date + timedelta(days=rng.randint(0, 730))
        else:
            segment = rng.choice(SEGMENTS)
            join_date = base_date + timedelta(days=rng.randint(0, 730))
        region = rng.choice(REGIONS)
        cur.execute(
            "INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?)",
            (i, name, email, segment, region, join_date.strftime("%Y-%m-%d")),
        )

    # ── Orders & Order Items ─────────────────────────────────────────
    # Generate ~3000 orders spanning 2024-01 to 2025-12
    order_start = datetime(2024, 1, 1)
    order_end = datetime(2025, 12, 31)
    total_days = (order_end - order_start).days

    order_id = 0
    item_id = 0
    shipment_id = 0

    for _ in range(3000):
        customer_id = rng.randint(0, 499)
        order_date = order_start + timedelta(days=rng.randint(0, total_days))
        
        # ── ANOMALY PLANTING: Q3 2025 APAC Electronics revenue drop ──
        # In Q3 2025, drastically reduce Electronics orders from APAC customers
        cur.execute("SELECT region, segment FROM customers WHERE customer_id = ?", (customer_id,))
        cust = cur.fetchone()
        cust_region = cust["region"]

        is_q3_2025 = (order_date.year == 2025 and order_date.month in (7, 8, 9))

        # Pick 1-4 items per order
        num_items = rng.randint(1, 4)
        order_total = 0.0
        items_for_order = []

        for _ in range(num_items):
            product_id = rng.randint(0, 49)
            prod_cat = PRODUCTS_DATA[product_id][1]
            prod_price = PRODUCTS_DATA[product_id][3]

            # Skip Electronics for APAC Q3 2025 (70% of the time) — creates the anomaly
            if is_q3_2025 and cust_region == "APAC" and prod_cat == "Electronics":
                if rng.random() < 0.70:
                    continue

            quantity = rng.randint(1, 3)
            discount = rng.choice([0.0, 0.0, 0.0, 0.05, 0.10, 0.15, 0.20])
            line_total = prod_price * quantity * (1 - discount)
            order_total += line_total
            items_for_order.append((product_id, quantity, prod_price, discount))

        if not items_for_order:
            continue

        status = rng.choice(["Completed", "Completed", "Completed", "Completed", "Shipped", "Processing"])
        cur.execute(
            "INSERT INTO orders VALUES (?, ?, ?, ?, ?)",
            (order_id, customer_id, order_date.strftime("%Y-%m-%d"), status, round(order_total, 2)),
        )

        for product_id, quantity, unit_price, discount in items_for_order:
            cur.execute(
                "INSERT INTO order_items VALUES (?, ?, ?, ?, ?, ?)",
                (item_id, order_id, product_id, quantity, unit_price, discount),
            )
            item_id += 1

        # ── Shipments ────────────────────────────────────────────────
        if status in ("Completed", "Shipped"):
            ship_date = order_date + timedelta(days=rng.randint(1, 3))
            if status == "Completed":
                delivery_date = ship_date + timedelta(days=rng.randint(2, 10))
                ship_status = "Delivered"
            else:
                delivery_date = None
                ship_status = "In Transit"
            carrier = rng.choice(CARRIERS)
            cur.execute(
                "INSERT INTO shipments VALUES (?, ?, ?, ?, ?, ?)",
                (shipment_id, order_id, ship_date.strftime("%Y-%m-%d"),
                 delivery_date.strftime("%Y-%m-%d") if delivery_date else None,
                 carrier, ship_status),
            )
            shipment_id += 1

        order_id += 1

    # ── PREMIUM SEGMENT BOOST (Task 3: trend_investigation) ──────────
    # Add extra orders for Premium customers in mid-late 2025
    premium_ids = list(range(400, 500))
    for _ in range(500):
        cid = rng.choice(premium_ids)
        order_date = datetime(2025, 1, 1) + timedelta(days=rng.randint(90, 364))
        num_items = rng.randint(1, 3)
        order_total = 0.0
        items_for_order = []
        for _ in range(num_items):
            product_id = rng.randint(0, 49)
            prod_price = PRODUCTS_DATA[product_id][3]
            quantity = rng.randint(1, 2)
            discount = rng.choice([0.0, 0.05, 0.10])
            line_total = prod_price * quantity * (1 - discount)
            order_total += line_total
            items_for_order.append((product_id, quantity, prod_price, discount))

        cur.execute(
            "INSERT INTO orders VALUES (?, ?, ?, ?, ?)",
            (order_id, cid, order_date.strftime("%Y-%m-%d"), "Completed", round(order_total, 2)),
        )
        for product_id, quantity, unit_price, discount in items_for_order:
            cur.execute(
                "INSERT INTO order_items VALUES (?, ?, ?, ?, ?, ?)",
                (item_id, order_id, product_id, quantity, unit_price, discount),
            )
            item_id += 1
        # Shipment
        ship_date = order_date + timedelta(days=rng.randint(1, 3))
        delivery_date = ship_date + timedelta(days=rng.randint(2, 7))
        cur.execute(
            "INSERT INTO shipments VALUES (?, ?, ?, ?, ?, ?)",
            (shipment_id, order_id, ship_date.strftime("%Y-%m-%d"),
             delivery_date.strftime("%Y-%m-%d"), rng.choice(CARRIERS), "Delivered"),
        )
        shipment_id += 1
        order_id += 1

    # ── Returns ──────────────────────────────────────────────────────
    # Higher return rates for: Electronics overall, and the 3 DISCONTINUE products
    return_id = 0
    # Get all completed order items
    cur.execute("""
        SELECT oi.item_id, oi.order_id, oi.product_id, oi.unit_price, oi.quantity,
               o.order_date, p.category, p.name as product_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.status = 'Completed'
    """)
    all_items = cur.fetchall()

    for item in all_items:
        prod_name = item["product_name"]
        category = item["category"]

        # Determine return probability
        if prod_name in DISCONTINUE_PRODUCTS:
            return_prob = 0.35  # Very high return rate
        elif category == "Electronics":
            return_prob = 0.15  # Higher than average
        elif category == "Clothing":
            return_prob = 0.08
        else:
            return_prob = 0.04

        if rng.random() < return_prob:
            # Bias Defective for Electronics and discontinue products
            if prod_name in DISCONTINUE_PRODUCTS or category == "Electronics":
                reason = rng.choice(["Defective", "Defective", "Defective", "Not as Described", "Wrong Item"])
            else:
                reason = rng.choice(RETURN_REASONS)

            order_date = datetime.strptime(item["order_date"], "%Y-%m-%d")
            return_date = order_date + timedelta(days=rng.randint(5, 30))
            refund = round(item["unit_price"] * item["quantity"] * rng.uniform(0.7, 1.0), 2)

            cur.execute(
                "INSERT INTO returns VALUES (?, ?, ?, ?, ?, ?)",
                (return_id, item["order_id"], item["product_id"],
                 reason, return_date.strftime("%Y-%m-%d"), refund),
            )
            return_id += 1

    # ── Reviews ──────────────────────────────────────────────────────
    review_id = 0
    review_texts_good = [
        "Excellent product, exceeded my expectations!",
        "Great quality, would buy again.",
        "Very satisfied with this purchase.",
        "Works perfectly. Highly recommend.",
        "Best purchase I've made this year.",
        "Outstanding quality for the price.",
    ]
    review_texts_mid = [
        "Decent product, nothing special.",
        "OK for the price. Average quality.",
        "It works, but could be better.",
        "Met my basic expectations.",
    ]
    review_texts_bad = [
        "Terrible quality. Broke within a week.",
        "Complete waste of money. Returning immediately.",
        "Does not work as advertised. Very disappointed.",
        "Worst product I've ever bought. Avoid!",
        "Defective on arrival. Unacceptable.",
        "Cheaply made, falls apart easily.",
    ]

    for prod_id in range(50):
        prod_name = PRODUCTS_DATA[prod_id][0]
        num_reviews = rng.randint(10, 40)

        for _ in range(num_reviews):
            cust_id = rng.randint(0, 499)
            review_date = datetime(2024, 1, 1) + timedelta(days=rng.randint(0, 730))

            # Bias bad reviews for discontinue products
            if prod_name in DISCONTINUE_PRODUCTS:
                rating = rng.choices([1, 2, 3, 4, 5], weights=[30, 30, 20, 15, 5])[0]
            elif prod_name in ("iPhone Pro Max 16", "MacBook Air M4", "Sony WH-1000XM6"):
                rating = rng.choices([1, 2, 3, 4, 5], weights=[2, 3, 10, 35, 50])[0]
            else:
                rating = rng.choices([1, 2, 3, 4, 5], weights=[5, 10, 15, 35, 35])[0]

            if rating >= 4:
                text = rng.choice(review_texts_good)
            elif rating == 3:
                text = rng.choice(review_texts_mid)
            else:
                text = rng.choice(review_texts_bad)

            cur.execute(
                "INSERT INTO reviews VALUES (?, ?, ?, ?, ?, ?)",
                (review_id, prod_id, cust_id, rating, text, review_date.strftime("%Y-%m-%d")),
            )
            review_id += 1

    conn.commit()
    return conn


# ── Query executor ───────────────────────────────────────────────────────────

def execute_query(conn: sqlite3.Connection, sql: str, max_rows: int = 50) -> Tuple[Optional[str], Optional[int], Optional[str]]:
    """
    Execute a SQL query and return (result_table, row_count, error).
    
    - Only SELECT queries allowed (read-only)
    - Results formatted as a readable ASCII table
    - Returns at most max_rows rows
    """
    sql_stripped = sql.strip().rstrip(";").strip()

    # Safety: only allow SELECT statements
    if not sql_stripped.upper().startswith("SELECT"):
        return None, None, "Only SELECT queries are allowed. Please write a SELECT statement."

    try:
        cur = conn.cursor()
        cur.execute(sql_stripped)
        columns = [desc[0] for desc in cur.description] if cur.description else []
        rows = cur.fetchmany(max_rows + 1)

        total_fetched = len(rows)
        truncated = total_fetched > max_rows
        if truncated:
            rows = rows[:max_rows]

        if not columns:
            return "(empty result)", 0, None

        # Format as ASCII table
        col_widths = [len(str(c)) for c in columns]
        for row in rows:
            for i, val in enumerate(row):
                col_widths[i] = max(col_widths[i], len(str(val) if val is not None else "NULL"))

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
            " | ".join(fmt(val, col_widths[i]) for i, val in enumerate(row))
            for row in rows
        ]

        table = header + "\n" + separator + "\n" + "\n".join(data_rows)
        if truncated:
            table += f"\n... (showing {max_rows} of {total_fetched}+ rows)"

        return table, len(rows), None

    except Exception as e:
        return None, None, f"SQL Error: {str(e)}"


def get_schema_string(conn: sqlite3.Connection) -> str:
    """Return a human-readable schema description."""
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cur.fetchall()]

    lines = ["DATABASE SCHEMA — E-Commerce Analytics Database", "=" * 50, ""]
    for table in tables:
        cur.execute(f"PRAGMA table_info({table})")
        cols = cur.fetchall()
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        row_count = cur.fetchone()[0]

        lines.append(f"📊 {table} ({row_count} rows)")
        lines.append("-" * 40)
        for col in cols:
            # col: (cid, name, type, notnull, default, pk)
            pk = " [PK]" if col[5] else ""
            nullable = "" if col[3] else " (nullable)"
            lines.append(f"  {col[1]:25s} {col[2]:10s}{pk}{nullable}")
        lines.append("")

    lines.append("RELATIONSHIPS:")
    lines.append("  orders.customer_id → customers.customer_id")
    lines.append("  order_items.order_id → orders.order_id")
    lines.append("  order_items.product_id → products.product_id")
    lines.append("  products.supplier_id → suppliers.supplier_id")
    lines.append("  shipments.order_id → orders.order_id")
    lines.append("  returns.order_id → orders.order_id")
    lines.append("  returns.product_id → products.product_id")
    lines.append("  reviews.product_id → products.product_id")
    lines.append("  reviews.customer_id → customers.customer_id")

    return "\n".join(lines)
