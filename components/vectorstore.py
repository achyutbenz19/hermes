from langchain_chroma import Chroma
from langchain_community.embeddings.sentence_transformer import (
    SentenceTransformerEmbeddings,
)

class Vectorstore:
    def __init__(self, name):
        self.db = Chroma(collection_name=name)
        
    def add(self, docs):
        embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
        self.db = self.db.from_documents(docs, embedding_function)
        print("Loaded")
    
    def query(self, query: str):
        results = self.db.similarity_search(query=query)
        return results