from datasets import load_dataset
import pandas as pd

DATA = r"C:\Users\bmb96\OneDrive\Desktop\MPJ\customer-feedback-prototype\backend\data\amazon_all_beauty_subset.csv"
ds = load_dataset("silva-fox/amazon-reviews-2023-sample", "100k", split="reviews", streaming=True)
rows = list(ds.take(3000))
pd.DataFrame(rows).to_csv(DATA, index=False)
print(f"Downloaded {len(rows)} rows")
