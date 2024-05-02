import os
from components.vectorstore import Vectorstore
from langchain_core.documents.base import Document
import re

def format_items(input_string):
    pattern = r"\d+\.\s([^:]+)\s+-\s+ID:\s+[\w-]+\s+-\s+Description:\s+([^\.]+)"
    matches = re.findall(pattern, input_string)
    formatted_output = []
    for item, description in matches:
        formatted_output.append(f"{item.strip()}: {description.strip()}")
    
    return '\n'.join(formatted_output)

vectorstore = Vectorstore()

path = "data/descriptions"
file_texts = []
for file_name in os.listdir(path):
    if file_name.endswith(".txt"):
        file_path = os.path.join(path, file_name)
        with open(file_path, "r") as file:
            file_text = file.read()
            file_texts.append(file_text)

for text in file_texts:
    cat = (text.split(":")[0]).lower()
    documents = [
        Document(
            page_content=format_items(text), 
            metadata={'category': cat}
        )
    ]
    vectorstore.add(documents)