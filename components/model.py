import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai.chat_models import ChatOpenAI
from config.prompt import SYSTEM_PROMPT

load_dotenv()

class LanguageModelProcessor:
    def __init__(self):
        self.llm = ChatGroq(temperature=0.5, model_name="mixtral-8x7b-32768", groq_api_key=os.getenv("GROQ_API_KEY"))
        self.store = {}
        
    def get_session_history(self, session_id: str) -> BaseChatMessageHistory:
        if session_id not in self.store:
            self.store[session_id] = ChatMessageHistory()
        return self.store[session_id]
    
    def chat(self, query):
        self.prompt = ChatPromptTemplate.from_messages([("system", SYSTEM_PROMPT), ("human", query)])
        runnable = self.prompt | self.llm
        context_runnable = RunnableWithMessageHistory(
            runnable,
            self.get_session_history,
            input_messages_key="query",
        )
        
        for chunk in context_runnable.stream({"query": query}, config={"configurable": {"session_id": "abc123"}}):
            print(chunk.content, end="", flush=True)
    
if __name__ == "__main__":
    llm = LanguageModelProcessor()
    query = input("\nHuman: ")
    while True and query != "q":
        llm.chat(query)
        query = input("\nHuman: ")
        