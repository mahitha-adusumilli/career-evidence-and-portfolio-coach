import { Schema, model } from "mongoose";

const evidenceChunkSchema = new Schema(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true
        },

        sourceId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true
        },

        sourceType: {
            type: String,
            required: true,
            enum: ["resume", "evidence"]
        },

        chunkIndex: {
            type: Number,
            required: true
        },

        chunkText: {
            type: String,
            required: true
        },

        embedding: {
            type: [Number],
            required: true
        }
    },
    {
        timestamps: true
    }
);

evidenceChunkSchema.index({
    studentId: 1,
    sourceId: 1,
    chunkIndex: 1
});

export const EvidenceChunk = model(
    "EvidenceChunk",
    evidenceChunkSchema
);