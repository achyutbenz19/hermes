require("dotenv").config();
const Pinecone = require("@pinecone-database/pinecone").Pinecone;
const OpenAIEmbeddings = require("@langchain/openai").OpenAIEmbeddings;
const PineconeStore = require("@langchain/pinecone").PineconeStore;

const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index("hermes");

async function query(query) {
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { pineconeIndex },
  );

  const results = await vectorStore.similaritySearch(query);
  return results;
}

query("what is the mot popular vegertarian entrees?");

module.exports = query;
