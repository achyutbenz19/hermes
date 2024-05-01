import json
from pathlib import Path
from pprint import pprint
from langchain_community.document_loaders import JSONLoader, UnstructuredMarkdownLoader
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter

class DocumentLoader:
    def __init__(self):
        return
    
    def json(self, path, chunk_size=1000, chunk_overlap=0):
        loader = JSONLoader(
            file_path=path,
            jq_schema='.content',
            text_content=False
        )
        docs = loader.load()
        splitted_docs = self.text_split(docs=docs, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        return splitted_docs
    
    def markdown(self, path, chunk_size=1000, chunk_overlap=0):
        loader = UnstructuredMarkdownLoader(markdown_path)
        docs = loader.load
        splitted_docs = self.text_split(docs=docs, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        return splitted_docs
    
    @staticmethod
    def text_split(docs, chunk_size, chunk_overlap):
        text_splitter = CharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        texts = text_splitter.split_documents(documents=docs)
        return texts
    
# doc = DocumentLoader()
# doc.json("data/buffets.json")