const readline = require("readline");
const { LanguageModelProcessor } = require("./components/model");
const { VectorStore } = require("./components/vectorstore");

async function main() {
  const j = new VectorStore();
  const l = new LanguageModelProcessor();
  await j.initVectorStore();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const query = await new Promise((resolve) => {
      rl.question('Enter your query (or type "exit" to quit): ', (input) =>
        resolve(input),
      );
    });

    if (query.toLowerCase() === "exit") {
      break;
    }

    const docs = await j.queryVectorStore(query);
    console.log(await l.chat(query, docs));
  }

  rl.close();
}

main();
