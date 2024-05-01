import chromadb

class Vectorstore:
    def __init__(self):
        self.chroma_client = chromadb.Client()
        
    def collection(self, name: str):
        self.collection = self.chroma_client.get_or_create_collection(name=name)
        print(f"{name} collection!")
    
    def upsert_data(self, data):
        try:
            self.collection.add(data)
            print("Data added")
        except e:
            print(e)
        
    def query(self, query: str, n_results: int):
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results