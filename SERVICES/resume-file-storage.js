
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "node:stream";

function getResumeBucket() {
    const db = mongoose.connection.db;

    if (!db) {
        throw new Error("MongoDB connection is not ready");
    }

    return new GridFSBucket(db, {
        bucketName: "resumeFiles"
    });
}

export function storeResumePDF(buffer, filename, ownerId) {
    const bucket = getResumeBucket();
    const fileId = new ObjectId();

    return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(filename, {
            id: fileId,
            contentType: "application/pdf",
            metadata: {
                ownerId: String(ownerId)
            }
        });

        uploadStream.once("error", reject);
        uploadStream.once("finish", () => resolve(fileId));

        Readable.from(buffer).pipe(uploadStream);
    });
}

export function getResumeFileStream(fileId) {
    if (!ObjectId.isValid(String(fileId))) {
        throw new Error("Invalid resume file ID");
    }

    return getResumeBucket().openDownloadStream(
        new ObjectId(String(fileId))
    );
}
