from components.vectorstore import Vectorstore
from components.loader import DocumentLoader
from components.model import LanguageModelProcessor
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

custom_prompt_template = """Use the following pieces of information to answer the user's question.
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context: {context}
Question: {question}

Only return the helpful answer below and nothing else.
Helpful answer:
"""

def set_custom_prompt():
    """
    Prompt template for QA retrieval for each vectorstore
    """
    prompt = PromptTemplate(template=custom_prompt_template,
                            input_variables=['context', 'question'])
    return prompt

prompt = set_custom_prompt()

query="what is the price of butter naan"

chat_model = LanguageModelProcessor()
llm = chat_model.get_llm()
retriever = Vectorstore().get_reteriever()
qa = RetrievalQA.from_chain_type(llm=llm,
                               chain_type="stuff",
                               retriever=retriever,
                               return_source_documents=True,
                               chain_type_kwargs={"prompt": prompt})
response = qa.invoke(query)
print(response['result'])

