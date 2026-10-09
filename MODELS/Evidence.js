import { Schema, model } from "mongoose";

const evidenceSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        skills: {
            type: [String],
            default: []
        },

        projectLink: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export const Evidence = model("Evidence", evidenceSchema);