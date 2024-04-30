import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.environ["GROQ_API_KEY"]

def batch():
    chat = ChatGroq(model_name="mixtral-8x7b-32768")
    prompt = ChatPromptTemplate.from_messages([("human", "Write a 200 word essay about {topic}")])
    chain = prompt | chat
    print(chain)
    
    for chunk in chain.stream({"topic": "The Moon"}):
        print(chunk.content, end="", flush=True)
        
batch()