
import {
    storeResumePDF,
    getResumeFileStream,
    deleteResumePDF
} from "../SERVICES/resume-file-storage.js";
import { Types } from "mongoose";
import exp from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { verifyToken } from "../MIDDLEWARES/auth-middleware.js";
import { Resume } from "../MODELS/resume.js";
import { indexText } from "../SERVICES/ragIndexingService.js";

export const resumeApp = exp.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
});

resumeApp.post("/upload", verifyToken, (req, res) => {
    upload.single("resume")(req, res, async (error) => {
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        let newFileId = null;
        let existingResume = null;
        let oldResumeData = null;
        let indexingAttempted = false;
        let metadataUpdated = false;

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload a PDF resume"
                });
            }

            // Extract text before changing the existing resume.
            const parser = new PDFParse({
                data: req.file.buffer
            });

            let result;

            try {
                result = await parser.getText();
            } finally {
                await parser.destroy();
            }

            if (!result.text || !result.text.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "No readable text found in the PDF"
                });
            }

            // Find this user's existing resume.
            existingResume = await Resume.findOne({
                owner: req.user.id
            });

            // Store the new PDF before changing existing data.
            newFileId = await storeResumePDF(
                req.file.buffer,
                req.file.originalname,
                req.user.id
            );

            if (existingResume) {
                // Keep the existing resume ID and save its old data
                // so we can attempt recovery if an update fails.
                oldResumeData = {
                    filename: existingResume.filename,
                    fileId: existingResume.fileId,
                    text: existingResume.text
                };

                // Re-index using the same source ID.
                indexingAttempted = true;

                await indexText(result.text, {
                    studentId: existingResume.owner,
                    sourceId: existingResume._id,
                    sourceType: "resume"
                });

                // Replace the existing resume document.
                existingResume.filename = req.file.originalname;
                existingResume.fileId = newFileId;
                existingResume.text = result.text;

                await existingResume.save();
                metadataUpdated = true;

                // Delete the previous PDF only after success.
                try {
                    await deleteResumePDF(oldResumeData.fileId);
                } catch (cleanupError) {
                    console.error(
                        "Old resume PDF cleanup failed:",
                        cleanupError
                    );
                }

                return res.status(200).json({
                    success: true,
                    message: "Resume replaced successfully",
                    resume: {
                        id: existingResume._id,
                        owner: existingResume.owner,
                        filename: existingResume.filename,
                        text: existingResume.text
                    }
                });
            }

            // First upload: create a resume document.
            const savedResume = await Resume.create({
                owner: req.user.id,
                filename: req.file.originalname,
                fileId: newFileId,
                text: result.text
            });

            existingResume = savedResume;

            // Index the resume using its permanent document ID.
            indexingAttempted = true;

            await indexText(savedResume.text, {
                studentId: savedResume.owner,
                sourceId: savedResume._id,
                sourceType: "resume"
            });

            return res.status(201).json({
                success: true,
                message: "Resume uploaded and saved successfully",
                resume: {
                    id: savedResume._id,
                    owner: savedResume.owner,
                    filename: savedResume.filename,
                    text: savedResume.text
                }
            });
        } catch (error) {
            console.error("Resume processing error:", error);

            // If replacement indexing or saving failed, try to
            // restore the previous resume's chunks.
            if (
                existingResume &&
                oldResumeData &&
                indexingAttempted &&
                !metadataUpdated
            ) {
                try {
                    await indexText(oldResumeData.text, {
                        studentId: existingResume.owner,
                        sourceId: existingResume._id,
                        sourceType: "resume"
                    });
                } catch (restoreError) {
                    console.error(
                        "Previous resume chunks could not be restored:",
                        restoreError
                    );
                }
            }

            // Remove a newly created resume document if its first
            // upload failed during indexing.
            if (
                existingResume &&
                !oldResumeData &&
                indexingAttempted &&
                !metadataUpdated
            ) {
                try {
                    await Resume.deleteOne({
                        _id: existingResume._id,
                        owner: req.user.id
                    });
                } catch (cleanupError) {
                    console.error(
                        "Failed to clean up resume document:",
                        cleanupError
                    );
                }
            }

            // Never intentionally delete the previous PDF here.
            if (newFileId) {
                try {
                    await deleteResumePDF(newFileId);
                } catch (cleanupError) {
                    console.error(
                        "New resume PDF cleanup failed:",
                        cleanupError
                    );
                }
            }

            if (error.name === "InvalidPDFException") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or corrupted PDF file"
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to process or save resume"
            });
        }
    });
});

resumeApp.get("/:id/file", verifyToken, async (req, res) => {
    try {
        if (!Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID"
            });
        }

        const resume = await Resume.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        const fileStream = getResumeFileStream(resume.fileId);

        res.setHeader("Content-Type", "application/pdf");
        res.attachment(resume.filename);

        fileStream.on("error", (error) => {
            console.error("Resume download error:", error);

            if (!res.headersSent) {
                res.status(404).json({
                    success: false,
                    message: "Original PDF file not found"
                });
            } else {
                res.destroy(error);
            }
        });

        fileStream.pipe(res);
    } catch (error) {
        console.error("Resume retrieval error:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve resume"
            });
        }

        res.destroy(error);
    }
});
