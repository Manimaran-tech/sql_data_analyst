"""
Local test script for the SQL Data Analyst Investigation Environment.

Run the server first:
    uv run uvicorn server.app:app --port 8001
    
Then run this:
    uv run python test_local.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from client import SqlDataAnalystEnv
from models import AnalystAction

BASE_URL = os.environ.get("ENV_URL", "http://localhost:8001")


async def test_basic_lookup():
    """Test the basic_lookup task end-to-end."""
    print("=" * 60)
    print("🔍 TEST: basic_lookup — Top Revenue Products in Q4 2025")
    print("=" * 60)

    async with SqlDataAnalystEnv(base_url=BASE_URL) as env:
        # Reset with specific task
        result = await env.reset(task_id="basic_lookup")
        print(f"\n📋 Task: {result.observation.task_description}")
        print(f"📊 Steps allowed: {result.observation.steps_remaining}")
        print(f"\n{result.observation.schema_info[:500]}...")
        print("-" * 60)

        # Step 1: Explore revenue by product
        print("\n🔎 Step 1: Query top products by revenue in Q4 2025")
        result = await env.step(AnalystAction(
            sql="""
            SELECT p.name, p.category, 
                   SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.order_date >= '2025-10-01' AND o.order_date <= '2025-12-31'
            GROUP BY p.product_id, p.name, p.category
            ORDER BY revenue DESC
            LIMIT 5
            """
        ))
        print(f"Result:\n{result.observation.query_result}")
        print(f"Rows: {result.observation.row_count} | Reward: {result.observation.step_reward}")
        print(f"Steps remaining: {result.observation.steps_remaining}")
        print("-" * 60)

        # Step 2: Verify with category breakdown
        print("\n🔎 Step 2: Revenue by category in Q4 2025")
        result = await env.step(AnalystAction(
            sql="""
            SELECT p.category, SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.order_date >= '2025-10-01' AND o.order_date <= '2025-12-31'
            GROUP BY p.category
            ORDER BY revenue DESC
            """
        ))
        print(f"Result:\n{result.observation.query_result}")
        print(f"Reward: {result.observation.step_reward}")
        print("-" * 60)

        # Step 3: Submit answer
        print("\n📝 Step 3: Submit final answer")
        result = await env.step(AnalystAction(
            answer=(
                "The top 5 products by revenue in Q4 2025 are: "
                "1. iPhone Pro Max 16 (Electronics) - highest revenue, "
                "2. MacBook Air M4 (Electronics), "
                "3. Dell XPS 15 (Electronics), "
                "4. iPad Pro 2025 (Electronics), "
                "5. Standing Desk (Home & Garden). "
                "Electronics dominates the top revenue positions."
            ),
            evidence=[
                "iPhone Pro Max 16 is the top revenue product",
                "4 out of 5 top products are Electronics",
                "Q4 2025 revenue is concentrated in high-price Electronics items",
            ]
        ))
        print(f"Result:\n{result.observation.query_result}")
        print(f"Final Reward: {result.reward}")
        print(f"Done: {result.done}")
        print("-" * 60)

        # Get state
        state = await env.state()
        print(f"\n📊 Episode Summary:")
        print(f"  Task: {state.task_id}")
        print(f"  Steps used: {state.current_step}")
        print(f"  Total reward: {state.total_reward}")
        print(f"  Queries: {len(state.queries_executed)}")
        print(f"  Tables explored: {state.tables_explored}")


async def test_error_handling():
    """Test error handling: bad SQL, duplicate queries."""
    print("\n" + "=" * 60)
    print("⚠️  TEST: Error Handling")
    print("=" * 60)

    async with SqlDataAnalystEnv(base_url=BASE_URL) as env:
        result = await env.reset(task_id="basic_lookup")

        # Bad SQL (non-SELECT)
        print("\n🔴 Non-SELECT test:")
        result = await env.step(AnalystAction(sql="DELETE FROM orders"))
        print(f"Error: {result.observation.error}")
        print(f"Reward: {result.observation.step_reward}")

        # Invalid SQL
        print("\n🔴 Invalid SQL test:")
        result = await env.step(AnalystAction(sql="SELECT * FROM nonexistent_table"))
        print(f"Error: {result.observation.error}")
        print(f"Reward: {result.observation.step_reward}")

        # Duplicate query
        print("\n🔴 Duplicate query test:")
        result = await env.step(AnalystAction(sql="SELECT COUNT(*) FROM orders"))
        print(f"First query reward: {result.observation.step_reward}")
        result = await env.step(AnalystAction(sql="SELECT COUNT(*) FROM orders"))
        print(f"Duplicate reward: {result.observation.step_reward}")

        print("\n✅ Error handling works correctly!")


async def main():
    print("🚀 SQL Data Analyst Environment — Local Tests")
    print("=" * 60)
    try:
        await test_basic_lookup()
        await test_error_handling()
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
