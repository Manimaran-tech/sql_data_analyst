import csv
import random
from datetime import datetime, timedelta

def main():
    print("Generating sample_sales.csv...")
    
    categories = {
        "Electronics": ["iPhone 15", "MacBook Air", "iPad Pro", "Smartwatch Ultra", "Bluetooth Speaker"],
        "Clothing": ["Leather Jacket", "Running Shoes", "Denim Jeans", "Wool Sweater", "Cotton T-Shirt"],
        "Home": ["Standing Desk", "Ergonomic Chair", "LED Desk Lamp", "Coffee Maker", "Air Purifier"],
        "Sports": ["Tennis Racket", "Yoga Mat", "Dumbbell Set", "Sleeping Bag", "Camping Tent"]
    }
    
    regions = ["APAC", "North America", "Europe", "LATAM"]
    segments = ["Consumer", "Corporate", "Home Office", "Premium"]
    
    start_date = datetime(2025, 1, 1)
    
    with open("sample_sales.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["order_id", "order_date", "product_name", "category", "quantity", "unit_price", "discount", "region", "customer_segment"])
        
        order_id = 1000
        for day in range(180): # Jan 1 to late June
            current_date = start_date + timedelta(days=day)
            date_str = current_date.strftime("%Y-%m-%d")
            
            # Number of orders per day
            num_orders = random.randint(10, 20)
            
            for _ in range(num_orders):
                category = random.choice(list(categories.keys()))
                product = random.choice(categories[category])
                region = random.choice(regions)
                segment = random.choice(segments)
                
                # Default pricing
                if category == "Electronics":
                    unit_price = round(random.uniform(200, 1200), 2)
                elif category == "Clothing":
                    unit_price = round(random.uniform(30, 150), 2)
                elif category == "Home":
                    unit_price = round(random.uniform(50, 400), 2)
                else:
                    unit_price = round(random.uniform(15, 200), 2)
                    
                quantity = random.randint(1, 4)
                discount = round(random.choice([0.0, 0.0, 0.0, 0.05, 0.1, 0.15, 0.2]), 2)
                
                # Plant the sales anomaly:
                # In June 2025 (month 6), Electronics sales in the APAC region drop drastically
                if current_date.month == 6 and category == "Electronics" and region == "APAC":
                    if random.random() < 0.85:
                        continue # Skip 85% of these orders to simulate a drop
                        
                writer.writerow([
                    order_id,
                    date_str,
                    product,
                    category,
                    quantity,
                    unit_price,
                    discount,
                    region,
                    segment
                ])
                order_id += 1
                
    print("Successfully generated sample_sales.csv with e-commerce data and a planted anomaly (Electronics drop in APAC in June)!")

if __name__ == "__main__":
    main()
