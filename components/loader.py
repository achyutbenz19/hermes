from typing import List
from langchain_text_splitters import CharacterTextSplitter
from langchain_core.documents.base import Document


class DocumentLoader:
    def __init__(
        self,
        chunk_size=1000,
        chunk_overlap=0
    ):
        self.splitter = CharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        return
    
    def text(self, string: str, metadata: dict = None) -> List[Document]:
        texts = self.splitter.split_text(string)
        if not metadata:
            docs = [Document(page_content=text) for text in texts]
        else:
            docs = [Document(page_content=text, metadata=metadata) for text in texts]
        
        return docs
