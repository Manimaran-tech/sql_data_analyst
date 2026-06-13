"""
Helper script to seed local PostgreSQL, MongoDB, and Firestore with sample_sales.csv data.

Usage:
  # To seed PostgreSQL (assuming standard local connection):
  .venv/Scripts/python scratch/seed_databases.py --db postgres --host localhost --user postgres --password postgres --dbname postgres

  # To seed MongoDB:
  .venv/Scripts/python scratch/seed_databases.py --db mongo --uri mongodb://localhost:27017 --dbname analytics

  # To seed Firestore Emulator:
  .venv/Scripts/python scratch/seed_databases.py --db firestore --project-id demo-test-project
"""

import sys
import os
import argparse
import csv

def parse_args():
    parser = argparse.ArgumentParser(description="Seed database with sample sales data")
    parser.add_argument("--db", choices=["postgres", "mongo", "firestore"], required=True, help="Database type to seed")
    parser.add_argument("--host", default="localhost", help="PostgreSQL host")
    parser.add_argument("--port", default="5432", help="PostgreSQL port")
    parser.add_argument("--user", default="postgres", help="PostgreSQL user")
    parser.add_argument("--password", default="postgres", help="PostgreSQL password")
    parser.add_argument("--dbname", default="postgres", help="Database/collection database name")
    parser.add_argument("--uri", default="mongodb://localhost:27017", help="MongoDB connection URI")
    parser.add_argument("--sa-path", default="", help="Firebase service account JSON path")
    parser.add_argument("--project-id", default="demo-test-project", help="Firebase project ID")
    return parser.parse_args()

def load_sales_csv():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_sales.csv")
    if not os.path.exists(csv_path):
        print(f"[ERROR] sample_sales.csv not found at {csv_path}")
        sys.exit(1)
        
    records = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Type conversions
            try:
                quantity = int(row.get("quantity", "1"))
            except ValueError:
                quantity = 1
                
            try:
                unit_price = float(row.get("unit_price", "0"))
            except ValueError:
                unit_price = 0.0
                
            try:
                discount = float(row.get("discount", "0"))
                if discount > 1:
                    discount = discount / 100.0
            except ValueError:
                discount = 0.0
                
            sales_amount = (quantity * unit_price) * (1 - discount)
            
            records.append({
                "order_id": row.get("order_id", ""),
                "order_date": row.get("order_date", ""),
                "product_name": row.get("product_name", ""),
                "category": row.get("category", ""),
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": discount,
                "sales_amount": round(sales_amount, 2),
                "region": row.get("region", ""),
                "customer_segment": row.get("customer_segment", "")
            })
    return records

def seed_postgres(args, records):
    import psycopg2
    from psycopg2.extras import execute_values
    
    print(f"Connecting to PostgreSQL at {args.host}:{args.port}...")
    try:
        conn = psycopg2.connect(
            host=args.host,
            port=args.port,
            user=args.user,
            password=args.password,
            database=args.dbname
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Create table
        print("Creating table 'sample_sales' if not exists...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sample_sales (
                order_id VARCHAR(50),
                order_date VARCHAR(50),
                product_name VARCHAR(255),
                category VARCHAR(100),
                quantity INTEGER,
                unit_price NUMERIC,
                discount NUMERIC,
                sales_amount NUMERIC,
                region VARCHAR(100),
                customer_segment VARCHAR(100)
            );
        """)
        
        # Clear existing records
        cur.execute("TRUNCATE TABLE sample_sales;")
        
        # Insert records
        print(f"Inserting {len(records)} records...")
        columns = records[0].keys()
        query = "INSERT INTO sample_sales ({}) VALUES %s".format(','.join(columns))
        values = [[r[col] for col in columns] for r in records]
        execute_values(cur, query, values)
        
        print("[SUCCESS] Seeded PostgreSQL successfully!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to seed PostgreSQL: {e}")
        print("\nMake sure your PostgreSQL server is running and the database exists.")

def seed_mongo(args, records):
    from pymongo import MongoClient
    
    print(f"Connecting to MongoDB at {args.uri}...")
    try:
        client = MongoClient(args.uri)
        db = client[args.dbname]
        collection = db["sample_sales"]
        
        # Drop existing
        print("Clearing existing collection 'sample_sales'...")
        collection.drop()
        
        # Insert
        print(f"Inserting {len(records)} documents...")
        collection.insert_many(records)
        
        print("[SUCCESS] Seeded MongoDB successfully!")
        client.close()
    except Exception as e:
        print(f"[ERROR] Failed to seed MongoDB: {e}")
        print("\nMake sure your MongoDB instance is running.")

def seed_firestore(args, records):
    import firebase_admin
    from firebase_admin import credentials as firebase_creds
    from firebase_admin import firestore
    
    # Check/set emulator host
    emulator_host = os.environ.get("FIRESTORE_EMULATOR_HOST", "localhost:8080")
    os.environ["FIRESTORE_EMULATOR_HOST"] = emulator_host
    print(f"Connecting to Firestore emulator at {emulator_host}...")
    
    sa_path = args.sa_path
    if not sa_path:
        # Check if dummy sa exists or generate it
        sa_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "dummy_firebase_sa.json"))
        if not os.path.exists(sa_path):
            import json
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives import serialization
            
            print("Generating dummy Firebase service account key...")
            private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            dummy_sa = {
              "type": "service_account",
              "project_id": args.project_id,
              "private_key_id": "dummy-key-id",
              "private_key": pem.decode("utf-8"),
              "client_email": f"dummy@{args.project_id}.iam.gserviceaccount.com",
              "client_id": "1234567890",
              "auth_uri": "https://accounts.google.com/o/oauth2/auth",
              "token_uri": "https://oauth2.googleapis.com/token",
              "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
              "client_x509_cert_url": "https://www.googleapis.com/metadata/x1"
            }
            with open(sa_path, "w") as f:
                json.dump(dummy_sa, f, indent=2)
            print(f"Created dummy Firebase service account at {sa_path}")
            
    try:
        app_name = f"seed_app_{args.project_id}"
        try:
            app = firebase_admin.get_app(app_name)
        except ValueError:
            cred = firebase_creds.Certificate(sa_path)
            app = firebase_admin.initialize_app(cred, name=app_name)
            
        db = firestore.client(app=app)
        col_ref = db.collection("sample_sales")
        
        # Clear existing
        print("Clearing existing documents in 'sample_sales'...")
        deleted_count = 0
        while True:
            docs = list(col_ref.limit(200).stream())
            if not docs:
                break
            batch = db.batch()
            for doc in docs:
                batch.delete(doc.reference)
            batch.commit()
            deleted_count += len(docs)
        print(f"Deleted {deleted_count} existing documents.")
        
        # Insert new documents in batches of 400
        print(f"Inserting {len(records)} documents in batches...")
        batch = db.batch()
        for i, record in enumerate(records):
            doc_id = record.get("order_id") or f"doc_{i}"
            batch.set(col_ref.document(doc_id), record)
            if (i + 1) % 400 == 0:
                batch.commit()
                batch = db.batch()
                print(f"Inserted {i + 1}/{len(records)}...")
        if len(records) % 400 != 0:
            batch.commit()
            
        print("[SUCCESS] Seeded Firestore successfully!")
    except Exception as e:
        print(f"[ERROR] Failed to seed Firestore: {e}")
        print("\nMake sure your Firestore emulator is running at localhost:8080 or the service account is valid.")

def main():
    args = parse_args()
    records = load_sales_csv()
    print(f"Loaded {len(records)} records from sample_sales.csv")
    
    if args.db == "postgres":
        seed_postgres(args, records)
    elif args.db == "mongo":
        seed_mongo(args, records)
    elif args.db == "firestore":
        seed_firestore(args, records)

if __name__ == "__main__":
    main()
