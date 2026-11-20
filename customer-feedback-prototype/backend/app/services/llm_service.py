import requests
from app.config import LLM_PROVIDER,LLM_MODEL,GEMINI_API_KEY,OPENAI_API_KEY

class LLMService:
    def configured(self):
        return bool((LLM_PROVIDER.lower()=="gemini" and GEMINI_API_KEY) or (LLM_PROVIDER.lower()=="openai" and OPENAI_API_KEY))

    def generate(self,prompt):
        if not self.configured(): raise RuntimeError("No LLM API key configured")
        if LLM_PROVIDER.lower()=="gemini":
            model=LLM_MODEL or "gemini-1.5-flash"
            url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            r=requests.post(url,json={"contents":[{"parts":[{"text":prompt}]}]},timeout=30)
            r.raise_for_status()
            return r.json()["candidates"][0]["content"]["parts"][0]["text"]
        if LLM_PROVIDER.lower()=="openai":
            model=LLM_MODEL or "gpt-4o-mini"
            r=requests.post("https://api.openai.com/v1/chat/completions",headers={"Authorization":f"Bearer {OPENAI_API_KEY}"},json={"model":model,"messages":[{"role":"user","content":prompt}],"temperature":0.2},timeout=30)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
        raise RuntimeError("Unsupported LLM provider")
