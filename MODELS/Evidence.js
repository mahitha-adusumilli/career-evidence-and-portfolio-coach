import { Schema, model } from "mongoose";

const evidenceSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
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
