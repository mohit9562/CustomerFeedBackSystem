from pydantic import BaseModel,Field
from typing import Any

class Review(BaseModel):
    review_id:str
    product_id:str
    parent_product_id:str
    review_title:str
    review_text:str
    rating:float
    review_date:str
    verified_purchase:bool
    helpful_votes:int
    sentiment:str
    category:str

class ChatRequest(BaseModel):
    question:str=Field(min_length=2,max_length=1000)
    session_id:str="demo-session"

class SummaryRequest(BaseModel):
    sentiment_filter:str="all"
