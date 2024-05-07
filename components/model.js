require("dotenv").config();
const { ChatGroq } = require("@langchain/groq");
const {
  ChatPromptTemplate,
  MessagesPlaceholder,
} = require("@langchain/core/prompts");
const { RunnableWithMessageHistory } = require("@langchain/core/runnables");
const {
  ChatMessageHistory,
} = require("@langchain/community/stores/message/in_memory");

class LanguageModelProcessor {
  constructor() {
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.5,
      model: "mixtral-8x7b-32768",
    });
    this.store = {};
    this.messageHistory = new ChatMessageHistory();
  }

  async chat(query) {
    this.prompt = ChatPromptTemplate.fromMessages([
      [
        "ai",
        "You are Hermes, a custer support conversational assistant for Himalayan resturant based in Niles, Chicago (8265 W Golf Rd, Niles, IL 60714). Use short, polite, natural and conversational responses as if you're having a live conversation. Your response should be under 20 words. Do not respond with any code, only conversation.",
      ],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);

    const runnable = this.prompt.pipe(this.llm);
    const contextRunnable = new RunnableWithMessageHistory({
      runnable,
      getMessageHistory: (_sessionId) => this.messageHistory,
      inputMessagesKey: "input",
      historyMessagesKey: "history",
    });

    const config = { configurable: { sessionId: "1" } };

    let output = await contextRunnable.invoke({ input: query }, config);
    return output.content;
  }
}

module.exports = { LanguageModelProcessor };
