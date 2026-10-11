import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
});

export async function splitTextIntoChunks(text) {
    if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error("Text must be a non-empty string");
    }

    const chunks = await textSplitter.splitText(text);

    return chunks;
}