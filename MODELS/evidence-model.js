import { Schema, model } from "mongoose";

const evidenceSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        type: {
            type: String,
            required: true
        },

        link: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

export const Evidence = model("Evidence", evidenceSchema);