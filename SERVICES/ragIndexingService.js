import { Types } from "mongoose";
import { splitTextIntoChunks } from "./chunkingService.js";
import { generateEmbedding } from "./embeddingService.js";
import { EvidenceChunk } from "../MODELS/chunkModel.js";

export async function indexText(text, metadata) {
    const { studentId, sourceId, sourceType } = metadata || {};

    if (!text || typeof text !== "string" || !text.trim()) {
        throw new Error("Text must be a non-empty string");
    }

    if (!Types.ObjectId.isValid(studentId)) {
        throw new Error("A valid studentId is required");
    }

    if (!Types.ObjectId.isValid(sourceId)) {
        throw new Error("A valid sourceId is required");
    }

    if (!["resume", "evidence"].includes(sourceType)) {
        throw new Error("sourceType must be resume or evidence");
    }

    const chunks = await splitTextIntoChunks(text);

    const records = [];

    for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);

        records.push({
            studentId,
            sourceId,
            sourceType,
            chunkIndex: i,
            chunkText: chunks[i],
            embedding
        });
    }

    // Remove previous chunks only after all embeddings are generated.
    await EvidenceChunk.deleteMany({
        studentId,
        sourceId,
        sourceType
    });

    await EvidenceChunk.insertMany(records);

    return {
        chunksCreated: records.length
    };
}