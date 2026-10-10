
import { Schema, model } from "mongoose";

const resumeSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        filename: {
            type: String,
            required: true,
            trim: true
        },
        text: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export const Resume = model("Resume", resumeSchema);
