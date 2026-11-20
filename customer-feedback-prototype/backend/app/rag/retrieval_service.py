from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RetrievalService:
    def __init__(self):
        self.vectorizer=None
        self.matrix=None
        self.reviews=[]

    def index(self,reviews):
        self.reviews=reviews
        texts=[f"{r.get('review_title','')} {r.get('review_text','')}" for r in reviews]
        self.vectorizer=TfidfVectorizer(stop_words="english",ngram_range=(1,2),max_features=12000)
        self.matrix=self.vectorizer.fit_transform(texts) if texts else None

    def retrieve(self,query,k=6):
        if self.matrix is None or not self.reviews: return []
        q=self.vectorizer.transform([query])
        scores=cosine_similarity(q,self.matrix).ravel()
        inds=scores.argsort()[::-1][:k]
        return [self.reviews[int(i)] for i in inds]
