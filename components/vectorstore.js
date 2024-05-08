require("dotenv").config();
const Pinecone = require("@pinecone-database/pinecone").Pinecone;
const OpenAIEmbeddings = require("@langchain/openai").OpenAIEmbeddings;
const PineconeStore = require("@langchain/pinecone").PineconeStore;

class VectorStore {
  constructor() {
    this.pinecone = new Pinecone();
    this.pineconeIndex = this.pinecone.Index("hermes");
    this.initVectorStore();
  }

  async initVectorStore() {
    this.vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { pineconeIndex: this.pineconeIndex }
    );
  }

  async queryVectorStore(query) {
    const results = await this.vectorStore.similaritySearch(query);
    return results;
  }

  async getRetriever() {
    return this.vectorStore.asRetriever({ searchKwargs: { k: 5 } });
  }
}

module.exports = { VectorStore };
