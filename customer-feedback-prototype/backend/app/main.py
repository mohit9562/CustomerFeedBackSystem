from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd, re
from datetime import datetime
from app.services.dataset_service import DatasetService
from app.services.llm_service import LLMService
from app.rag.retrieval_service import RetrievalService
from app.schemas.schemas import ChatRequest, SummaryRequest

app=FastAPI(title="InsightIQ API",version="1.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
dataset=DatasetService(); retrieval=RetrievalService(); llm=LLMService()
retrieval.index(dataset.reviews.to_dict("records"))

def reviews_dict(): return dataset.reviews.to_dict("records")

@app.exception_handler(Exception)
async def global_error(request,exc):
    return JSONResponse(status_code=500,content={"detail":"An unexpected server error occurred","error":str(exc)})

@app.get("/api/health")
def health(): return {"status":"healthy","application":"InsightIQ","llm_status":"configured" if llm.configured() else "demo","dataset_loaded":not dataset.reviews.empty}

@app.get("/api/dataset/info")
def info():
    df=dataset.reviews
    return {**dataset.info,"name":dataset.info["name"],"number_of_records":len(df),"number_of_products":int(df.product_id.nunique()) if not df.empty else 0,"record_count":len(df),"dataset_type":dataset.info["dataset_type"],"last_processed":dataset.info["last_processed"]}

@app.get("/api/dataset/reviews")
def list_reviews(page:int=1,page_size:int=20,search:str="",sentiment:str="",rating:str="",verified_purchase:str="",sort_by:str="review_date",sort_order:str="desc"):
    df=dataset.reviews.copy()
    if search:
        s=search.lower(); df=df[df.review_title.str.lower().str.contains(s,na=False)|df.review_text.str.lower().str.contains(s,na=False)]
    if sentiment and sentiment.lower()!="all": df=df[df.sentiment.str.lower()==sentiment.lower()]
    if rating:
        try:
            vals=[float(x) for x in rating.split(",") if x]; df=df[df.rating.isin(vals)]
        except: pass
    if verified_purchase:
        df=df[df.verified_purchase == (verified_purchase.lower()=="true")]
    sort_col=sort_by if sort_by in df.columns else "review_date"
    df=df.sort_values(sort_col,ascending=(sort_order=="asc"),kind="stable")
    total=len(df); start=(page-1)*page_size
    rows=df.iloc[start:start+page_size].to_dict("records")
    return {"items":rows,"data":rows,"total":total,"page":page,"page_size":page_size,"total_pages":max(1,(total+page_size-1)//page_size)}

@app.get("/api/dataset/reviews/{review_id}")
def review_detail(review_id:str):
    r=dataset.reviews[dataset.reviews.review_id==review_id]
    if r.empty: raise HTTPException(404,"Review not found")
    return r.iloc[0].to_dict()

@app.post("/api/dataset/upload")
async def upload(file:UploadFile=File(...)):
    if not file.filename.lower().endswith(".csv"): raise HTTPException(400,"Only CSV files are accepted")
    try:
        content=await file.read(); import io
        df=pd.read_csv(io.BytesIO(content))
        count=dataset.normalize(df,"real","Uploaded CSV; normalized locally")
        retrieval.index(reviews_dict())
        return {"success":True,"processing_summary":{"records_loaded":count,"duplicates_removed":"applied","filename":file.filename},"records_loaded":count}
    except Exception as e: raise HTTPException(422,f"Invalid CSV: {e}")

@app.post("/api/dataset/reload")
def reload():
    dataset.load_default(); retrieval.index(reviews_dict()); return {"success":True,**dataset.info}

@app.post("/api/dataset/reindex")
def reindex():
    retrieval.index(reviews_dict()); dataset.info["vector_status"]="indexed"; return {"success":True,"vector_status":"indexed","retrieval_method":"TF-IDF fallback"}

@app.get("/api/analytics/overview")
def overview():
    df=dataset.reviews
    if df.empty: raise HTTPException(404,"Dataset is not loaded")
    counts=df.sentiment.value_counts()
    total=len(df)
    return {"total_reviews":total,"average_rating":round(float(df.rating.mean()),2),"positive_reviews":int(counts.get("Positive",0)),"negative_reviews":int(counts.get("Negative",0)),"neutral_reviews":int(counts.get("Neutral",0)),"sentiment_percentages":{"positive":round(counts.get("Positive",0)/total*100,1),"neutral":round(counts.get("Neutral",0)/total*100,1),"negative":round(counts.get("Negative",0)/total*100,1)}}

@app.get("/api/analytics/ratings")
def ratings():
    c=dataset.reviews.rating.value_counts().to_dict(); return {"ratings":[{"rating":str(i),"count":int(c.get(float(i),0))} for i in range(1,6)]}

@app.get("/api/analytics/trends")
def trends():
    df=dataset.reviews.copy()
    valid=df[df.review_date.str.match(r"^\d{4}-\d{2}",na=False)].copy()
    valid["month"]="-" if valid.empty else valid.review_date.str[:7]
    counts=valid.groupby("month").size().sort_index()
    return {"trends":[{"month":m,"count":int(v)} for m,v in counts.items()]}

THEMES={"positive":{"quality":"quality","scent":"scent","soft":"soft","effectiveness":"effective","delivery":"delivery","value":"value","gentle":"gentle"},"negative":{"pump":"pump","irritation":"irritation","leak":"leak","scent":"scent","quality":"quality","packaging":"packaging","delivery":"delivery","price":"price"}}
def theme_counts(sentiment,limit=6):
    df=dataset.reviews[dataset.reviews.sentiment==sentiment]
    words={}; source=THEMES["positive" if sentiment=="Positive" else "negative"]
    for label,term in source.items(): words[label]=int(df.review_text.str.lower().str.contains(term,na=False).sum())
    return [{"theme":k,"count":v} for k,v in sorted(words.items(),key=lambda x:x[1],reverse=True)[:limit] if v>0]

@app.get("/api/analytics/themes")
def themes():
    return {"positive_themes":theme_counts("Positive"),"negative_themes":theme_counts("Negative"),"frequent_issues":theme_counts("Negative")}

@app.post("/api/summary/generate")
def generate_summary(body:SummaryRequest):
    df=dataset.reviews
    filt={"all":"all","positive":"Positive","negative":"Negative","neutral":"Neutral"}.get(body.sentiment_filter.lower(),"all")
    subset=df if filt=="all" else df[df.sentiment==filt]
    if subset.empty: raise HTTPException(404,"No reviews match this filter")
    pos=subset[subset.sentiment=="Positive"].sort_values("helpful_votes",ascending=False).head(4)
    neg=subset[subset.sentiment=="Negative"].sort_values("helpful_votes",ascending=False).head(4)
    rep=subset.sort_values(["helpful_votes","rating"],ascending=False).head(5)
    positives=[r.review_text for _,r in pos.iterrows()]
    negatives=[r.review_text for _,r in neg.iterrows()]
    context="\n".join([f"[{r.review_id}] ({r.rating}/5) {r.review_text}" for _,r in subset.head(80).iterrows()])
    live=llm.configured()
    text=""
    if live:
        prompt=f"Create a concise structured customer feedback report from the supplied reviews. Use only supplied evidence, preserve review IDs, and state insufficient evidence explicitly.\n{context}\nSections: overall feedback, positive experiences, negative experiences, complaints, themes, improvements."
        try: text=llm.generate(prompt)
        except Exception: live=False
    if not live:
        total=len(subset); avg=round(subset.rating.mean(),2)
        pospct=round((subset.sentiment=="Positive").mean()*100,1)
        negpct=round((subset.sentiment=="Negative").mean()*100,1)
        text=f"Analysis of {total} actual review records found an average rating of {avg}/5, with {pospct}% positive and {negpct}% negative by rating-based sentiment classification. Positive feedback emphasizes product quality and customer experience, while negative feedback highlights performance, irritation, scent, packaging, delivery, or value concerns. Insights below are extractive and evidence-grounded."
    return {"summary":text,"positive_feedback":positives[:3],"negative_feedback":negatives[:3],"common_complaints":theme_counts("Negative",5),"themes":[*theme_counts("Positive",4),*theme_counts("Negative",4)],"suggested_improvements":["Investigate recurring product defects and packaging issues","Improve quality consistency and delivery handling","Review fragrance strength and skin-sensitivity concerns"],"representative_reviews":rep[["review_id","rating","sentiment","review_text"]].to_dict("records"),"reviews_analyzed":len(subset),"generation_mode":"live_llm" if live else "demo_extractive","generated_at":datetime.now().isoformat(timespec="seconds")}

@app.post("/api/chat/query")
def chat(body:ChatRequest):
    q=body.question.lower()
    df=dataset.reviews
    aggregate=None
    if any(x in q for x in ["percentage","percent","negative"] ) and any(x in q for x in ["negative","low rating"]):
        n=int((df.sentiment=="Negative").sum()); aggregate=f"According to the dataset, {n} of {len(df)} reviews are negative ({n/len(df)*100:.1f}%). This uses rating-based sentiment: ratings 1–2 are negative."
    if "percentage" in q and "positive" in q:
        n=int((df.sentiment=="Positive").sum()); aggregate=f"According to the dataset, {n} of {len(df)} reviews are positive ({n/len(df)*100:.1f}%)."
    retrieved=retrieval.retrieve(body.question,6)
    context="\n".join([f"[{r['review_id']}] Rating {r['rating']}/5 ({r['sentiment']}): {r['review_text']}" for r in retrieved])
    live=llm.configured(); answer=aggregate or ""
    if live:
        prompt=f"Answer strictly from the supplied reviews. Never invent quotations, statistics, or review IDs. Explicitly say insufficient evidence if needed. User question: {body.question}\nRetrieved reviews:\n{context}"
        try: answer=llm.generate(prompt)
        except Exception: live=False
    if not live:
        if not answer:
            if any(x in q for x in ["complaint","problem","negative","low rating","quality"]):
                sample=[r for r in retrieved if r["sentiment"]=="Negative"][:3]
            elif any(x in q for x in ["appreciate","like","positive","love"]):
                sample=[r for r in retrieved if r["sentiment"]=="Positive"][:3]
            else: sample=retrieved[:3]
            if sample:
                answer="Based on the retrieved records, recurring evidence includes: " + "; ".join(f"review {r['review_id']} reports '{r['review_text'][:180]}'" for r in sample) + "."
            else: answer="The available evidence is insufficient to answer this question from the retrieved reviews."
    return {"answer":answer,"supporting_reviews":[{"review_id":r["review_id"],"rating":r["rating"],"sentiment":r["sentiment"],"review_text":r["review_text"]} for r in retrieved],"retrieved_count":len(retrieved),"generation_mode":"live_llm" if live else "demo_extractive"}
