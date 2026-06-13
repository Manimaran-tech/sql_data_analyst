import asyncio
import sys, os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.adapters.firebase import FirebaseAdapter

# Set emulator host
os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"

# Generate a valid private key PEM using cryptography
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)
private_key_pem = pem.decode("utf-8")

# Generate a dummy service account file
dummy_sa = {
  "type": "service_account",
  "project_id": "demo-test-project",
  "private_key_id": "dummy-key-id",
  "private_key": private_key_pem,
  "client_email": "dummy@demo-test-project.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/metadata/x1"
}

dummy_sa_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "dummy_firebase_sa.json"))

with open(dummy_sa_path, "w") as f:
    json.dump(dummy_sa, f, indent=2)

print(f"Created dummy service account file at: {dummy_sa_path}")

async def main():
    a = FirebaseAdapter()
    print("Connecting to Firestore emulator...")
    connected = await a.connect({
        "service_account_path": dummy_sa_path,
        "project_id": "demo-test-project"
    })
    print(f"Connected: {connected}")
    
    # Try to write some dummy test data directly using firebase_admin client
    db = a._db
    assert db is not None, "Database client is None"
    print("Writing a sample record to collection 'sample_sales'...")
    doc_ref = db.collection("sample_sales").document("test_doc")
    doc_ref.set({
        "order_id": "9999",
        "order_date": "2025-06-13",
        "product_name": "Test Product",
        "category": "Electronics",
        "quantity": 2,
        "unit_price": 500.0,
        "discount": 0.1,
        "sales_amount": 900.0,
        "region": "APAC",
        "customer_segment": "Consumer"
    })
    print("Sample record written!")
    
    # Get schema
    schema = await a.get_schema()
    print("=== SCHEMA ===")
    print(schema)
    
    # Get preview
    col, rows = await a.get_preview()
    print("=== PREVIEW ===")
    print(f"Collection: {col}")
    print(f"Rows count: {len(rows)}")
    if rows:
        print(f"First row: {rows[0]}")
        
    # Execute query
    print("=== EXECUTE ===")
    q = json.dumps({
        "collection": "sample_sales",
        "where": [
            ["category", "==", "Electronics"]
        ],
        "limit": 5
    })
    table, count, err, raw = await a.execute(q)
    print(f"Error: {err}")
    print(f"Count: {count}")
    print(f"Formatted Table:\n{table}")
    
    await a.close()

if __name__ == "__main__":
    asyncio.run(main())
