import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from config.prompt import SYSTEM_PROMPT

load_dotenv()

class LanguageModelProcessor:
    def __init__(self):
        self.llm = ChatGroq(temperature=0.5, model_name="mixtral-8x7b-32768", groq_api_key=os.getenv("GROQ_API_KEY"))
    
    def chat(self, query):
        self.prompt = ChatPromptTemplate.from_messages([("system", SYSTEM_PROMPT), ("human", query)])
        chain = self.prompt | self.llm
        for chunk in chain.stream({"query": query}):
            print(chunk.content, end="", flush=True)
    
if __name__ == "__main__":
    llm = LanguageModelProcessor()
    query = input("\nHuman: ")
    while True and query != "q":
        llm.chat(query)
        query = input("\nHuman: ")
        