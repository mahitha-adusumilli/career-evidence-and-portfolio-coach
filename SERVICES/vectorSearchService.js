import { Types } from "mongoose";
import { generateEmbedding } from "./embeddingService.js";
import { EvidenceChunk } from "../MODELS/chunkModel.js";

export async function searchRelevantChunks(question, studentId, limit = 5) {
    if (typeof question !== "string" || question.trim().length === 0) {
        throw new Error("Question must not be empty");
    }

    if (!Types.ObjectId.isValid(studentId)) {
        throw new Error("A valid studentId is required");
    }

    const queryVector = await generateEmbedding(question.trim());

    if (!Array.isArray(queryVector) || queryVector.length === 0) {
        throw new Error("Embedding generation failed");
    }

    const studentObjectId = new Types.ObjectId(studentId);

    const results = await EvidenceChunk.aggregate([
        {
            $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector,
                numCandidates: Math.max(limit * 20, 100),
                limit,
                filter: { studentId: new Types.ObjectId(studentId) }
                // If studentId is stored as a STRING in the database, use this instead:
                // filter: { studentId: String(studentId) }
            }
        },
        {
            $project: {
                _id: 1,
                sourceId: 1,
                sourceType: 1,
                chunkIndex: 1,
                chunkText: 1,
                score: { $meta: "vectorSearchScore" }
            }
        }
    ]);

    console.log({
        queryDims: queryVector.length,
        studentId: String(studentId),
        resultCount: results.length
    });

    return results;
}