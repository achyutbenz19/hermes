from typing import Optional, List
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents.base import Document
from pinecone import Pinecone, ServerlessSpec
import os
from langchain_openai import OpenAIEmbeddings

class Vectorstore:
    def __init__(
            self,
            index_name: str = "hermes",
    ) -> None:
        self.index_name = index_name
        self.vectorstore: Optional[PineconeVectorStore] = None
        self.client: Optional[Pinecone] = None
        self.index = None
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small", disallowed_special=())
        self.init_vectorstore()

    def init_vectorstore(self) -> None:
        if self.client and self.vectorstore:
            return None

        self.client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

        if self.index_name not in self.client.list_indexes().names():
            self.client.create_index(
                name=self.index_name,
                dimension=len(self.embeddings.embed_query("test")),
                spec=ServerlessSpec(
                    cloud='aws', 
                    region='us-east-1'
                )
            )
        
        self.index = self.client.Index(
            name=self.index_name,
            pool_threads=5,
        )
        self.vectorstore = PineconeVectorStore(
            index=self.index,
            embedding=self.embeddings,
        )

    def add(self, docs: List[Document]):
        ids = self.vectorstore.add_documents(docs)
        print(f"{len(ids) + 1} added")

    def query(self, query: str, filter: dict = None):
        results = self.vectorstore.similarity_search(query=query, filter=filter)
        return results

    def get_reteriever(self):
        retriever = self.vectorstore.as_retriever(search_kwargs={'k': 5})
        return retriever
    