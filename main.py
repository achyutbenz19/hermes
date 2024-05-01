from components.vectorstore import Vectorstore
from components.loader import DocumentLoader

db = Vectorstore("test")
loader = DocumentLoader()

texts = loader.json("data/home.json",1000,0)
data = db.add(docs=texts)
print(data)
ans = db.query("What does the family meal comprise of?")
print(ans[0].page_content)