import { OllamaEmbeddings } from "@langchain/ollama";

const embeddingModel = new OllamaEmbeddings({
    model: "nomic-embed-text:latest",
    baseUrl: "http://localhost:11434"
});

export async function generateEmbedding(text) {
    if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error("Text must be a non-empty string");
    }

    const embedding = await embeddingModel.embedQuery(text);

    return embedding;
}