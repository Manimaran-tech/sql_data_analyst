"""Factory reset and rebuild the Space."""
from huggingface_hub import HfApi
import time

with open(r"C:\Users\K\.cache\huggingface\token", "r") as f:
    token = f.read().strip()

api = HfApi(token=token)

# Check current state
info = api.space_info("Markmayandi/sql_data_analyst")
print(f"Current stage: {info.runtime.stage}")
print(f"Hardware: {info.runtime.raw}")

# Try factory reboot (clears build cache)
print("\nFactory resetting Space...")
try:
    api.restart_space("Markmayandi/sql_data_analyst", factory_reboot=True)
    print("Factory reboot triggered!")
except Exception as e:
    print(f"Error: {e}")

# Single check after 10 seconds
time.sleep(10)
info = api.space_info("Markmayandi/sql_data_analyst")
print(f"After restart: {info.runtime.stage}")
