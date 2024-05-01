import json
from pathlib import Path
from pprint import pprint
from langchain_community.document_loaders import JSONLoader, UnstructuredMarkdownLoader

class DocumentLoader:
    def __init__(self):
        return
    
    def json(self, path):
        loader = JSONLoader(
            file_path=path,
            jq_schema='.content',
            text_content=False
        )
        docs = loader.load()
        return docs
    
    def markdown(self, path):
        loader = UnstructuredMarkdownLoader(markdown_path)
        docs = loader.load
        return docs
    
# doc = DocumentLoader()
# doc.json("data/buffets.json")