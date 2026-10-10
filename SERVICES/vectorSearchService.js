import { Types } from "mongoose";
import { generateEmbedding } from "./embeddingService.js";
import { EvidenceChunk } from "../MODELS/chunkModel.js";

export async function searchRelevantChunks(
    question,
    studentId,
    limit = 5
) {
    if (
        typeof question !== "string" ||
        question.trim().length === 0
    ) {
        throw new Error("Question must not be empty");
    }

    if (!Types.ObjectId.isValid(studentId)) {
        throw new Error("A valid studentId is required");
    }

    const queryVector = await generateEmbedding(question);

    const results = await EvidenceChunk.aggregate([
        {
            $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector: queryVector,
                numCandidates: Math.max(limit * 10, 50),
                limit: limit,
                filter: {
                    studentId: new Types.ObjectId(studentId)
                }
            }
        },
        {
            $project: {
                _id: 1,
                sourceId: 1,
                sourceType: 1,
                chunkIndex: 1,
                chunkText: 1,
                score: {
                    $meta: "vectorSearchScore"
                }
            }
        }
    ]);

    return results;
}