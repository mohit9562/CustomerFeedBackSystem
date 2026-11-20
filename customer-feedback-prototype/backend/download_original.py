from datasets import load_dataset
import pandas as pd

DATA = r"C:\Users\bmb96\OneDrive\Desktop\MPJ\customer-feedback-prototype\backend\data\amazon_all_beauty_subset.csv"
ds = load_dataset("McAuley-Lab/Amazon-Reviews-2023", "raw_review_All_Beauty", split="full", streaming=True)
rows = list(ds.take(3000))
pd.DataFrame(rows).to_csv(DATA, index=False)
print(f"Downloaded {len(rows)} All_Beauty rows")
