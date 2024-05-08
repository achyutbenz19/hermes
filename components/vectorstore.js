const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

class Vectorstore {
    constructor(indexName = 'hermes') {
        this.indexName = indexName;
        this.client = new Pinecone();
        this.embeddings = new OpenAIEmbeddings();
        this.vectorstore = null;
        this.initialize();
    }

    async initialize() {
        try {
            console.log(process.env.PINECONE_API_KEY, "is API")
            const index = await this.client.Index(this.indexName);
            const pineconeConfig = {
                indexName: this.indexName,
                environment: process.env.PINECONE_ENVIRONMENT
            };
            this.vectorstore = await PineconeStore.fromExistingIndex(
                this.embeddings,
                {
                    index,
                    pineconeConfig
                }
            );
        } catch (error) {
            console.error("Initialization error:", error);
        }
    }

    async query(query) {
        const results = await this.vectorstore.similaritySearch(query)
        return results
    }

    getRetriever() {
        return this.vectorstore.asRetriever({ searchKwargs: { k: 5 } });
    }
}

const model = new Vectorstore();
model.initialize().then(() => {
    model.query("what is chicken tikka masala?")
}).catch(console.error);

module.exports = Vectorstore;
