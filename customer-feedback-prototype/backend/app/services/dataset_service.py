from pathlib import Path
import pandas as pd
from datetime import datetime, timezone
from app.config import DATA_PATH, SOURCE_CSV

class DatasetService:
    def __init__(self):
        self.reviews = pd.DataFrame()
        self.info = {"name":"Amazon Reviews 2023 — All Beauty subset","source":"silva-fox/amazon-reviews-2023-sample (100k config)","dataset_type":"real","processing_status":"not loaded","last_processed":None,"vector_status":"not indexed","retrieval_method":"TF-IDF fallback"}
        self.load_default()

    def normalize(self, df: pd.DataFrame, dataset_type="real", source=None):
        lower = {str(c).strip().lower(): c for c in df.columns}
        def col(*names):
            for n in names:
                if n in lower: return lower[n]
            return None
        def get(row,names,default=None):
            c=col(*names); return row[c] if c and c in row else default
        out=[]
        for i,row in df.iterrows():
            text=str(get(row,["review_text","text","review"],"")).strip()
            if not text or text.lower()=="nan": continue
            try: rating=float(get(row,["rating","stars"],3))
            except: continue
            if rating not in (1,2,3,4,5): continue
            timestamp=get(row,["timestamp","review_date","date"])
            review_date=""
            try:
                if pd.notna(timestamp):
                    ts=float(timestamp)
                    dt=datetime.fromtimestamp(ts/1000 if ts>1e12 else ts, timezone.utc)
                    review_date=dt.strftime("%Y-%m-%d")
            except: review_date=str(timestamp)[:10] if timestamp is not None else ""
            sentiment="Negative" if rating<=2 else "Neutral" if rating==3 else "Positive"
            asin=str(get(row,["asin","product_id","product"],"UNKNOWN") or "UNKNOWN")
            parent=str(get(row,["parent_asin","parent_product_id"],asin) or asin)
            title=str(get(row,["title","review_title","name"],"Customer review") or "Customer review")
            pid=f"REV-{i+1:06d}" if get(row,["review_id","id"] ) is None else str(get(row,["review_id","id"]))
            out.append({"review_id":pid,"product_id":"B"+asin[1:] if asin.startswith("B") else asin,"parent_product_id":"B"+parent[1:] if parent.startswith("B") else parent,"review_title":title,"review_text":" ".join(text.split()),"rating":rating,"review_date":review_date or "Unknown","verified_purchase":bool(get(row,["verified_purchase","verified"],False)==True or str(get(row,["verified_purchase","verified"],"")).lower()=="true"),"helpful_votes":int(get(row,["helpful_vote","helpful_votes"],0) or 0),"sentiment":sentiment,"category":"All Beauty"})
        df=pd.DataFrame(out).drop_duplicates(subset=["review_text","rating"])
        df["review_id"]=[f"REV-{i+1:06d}" for i in range(len(df))]
        self.reviews=df
        self.info.update({"dataset_type":dataset_type,"source":source or ("Community 100k sample; subset of Amazon Reviews 2023" if dataset_type=="real" else "Synthetic fallback dataset"),"name":"Amazon Reviews 2023 — All Beauty subset" if dataset_type=="real" else "Synthetic All Beauty Demo Dataset","processing_status":"processed","last_processed":datetime.now().isoformat(timespec="seconds"),"vector_status":"indexed","retrieval_method":"TF-IDF fallback"})
        DATA_PATH.parent.mkdir(parents=True,exist_ok=True)
        df.to_csv(DATA_PATH,index=False)
        return len(df)

    def load_default(self):
        if SOURCE_CSV.exists():
            try:
                df=pd.read_csv(SOURCE_CSV)
                df=df.head(3000)
                self.normalize(df,"real","Amazon Reviews 2023; silva-fox/amazon-reviews-2023-sample, 100k config")
                return
            except Exception:
                pass
        self.generate_synthetic()

    def generate_synthetic(self):
        import random
        positives=["The serum feels lightweight and absorbs quickly","The shampoo leaves my hair soft and shiny","The fragrance is pleasant and lasts all day","Great quality and excellent value","Easy to apply and gentle on sensitive skin"]
        negatives=["The pump stopped working after a few uses","The lotion caused irritation and redness","The bottle leaked during delivery","The scent was too strong and faded quickly","The product quality did not match the description"]
        neutral=["The result is decent but not as strong as expected","Works as described, although shipping was slow","Average quality for the price"]
        rows=[]
        random.seed(42)
        for i in range(300):
            rating=random.choices([1,2,3,4,5],[12,13,12,28,35])[0]
            text=random.choice(negatives if rating<=2 else positives if rating>=4 else neutral)
            rows.append({"review_id":f"REV-{i+1:06d}","asin":f"B{i%60:07d}","parent_asin":f"B{i%60:07d}","title":text.split()[0].title()+" Experience","text":text+"; product received on time." if i%3 else text+".","rating":rating,"timestamp":int(datetime(2024,1+(i%12),1+(i%28),tzinfo=timezone.utc).timestamp()*1000),"verified_purchase":i%4!=0,"helpful_vote":random.randint(0,18)})
        df=pd.DataFrame(rows)
        self.normalize(df,"synthetic","Clearly labelled synthetic fallback dataset")
