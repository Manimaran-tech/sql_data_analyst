import asyncio
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.adapters.postgres import PostgresAdapter
from backend.adapters.mongo import MongoAdapter

async def test_postgres():
    print("=== POSTGRES PREVIEW ===")
    a = PostgresAdapter()
    await a.connect({'host':'localhost','port':5432,'user':'postgres','password':'postgres','database':'postgres'})
    t, r = await a.get_preview()
    print(f"Table: {t}")
    if r:
        print(f"Keys: {list(r[0].keys())}")
        print(f"First row: {r[0]}")
    else:
        print("EMPTY")
    await a.close()

async def test_mongo():
    print("\n=== MONGO PREVIEW ===")
    a = MongoAdapter()
    await a.connect({'uri':'mongodb://localhost:27017','database':'analytics'})
    t, r = await a.get_preview()
    print(f"Collection: {t}")
    if r:
        print(f"Keys: {list(r[0].keys())}")
        print(f"First row: {r[0]}")
    else:
        print("EMPTY")
    await a.close()

async def main():
    await test_postgres()
    await test_mongo()

asyncio.run(main())
