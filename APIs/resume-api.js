import { storeResumePDF, getResumeFileStream } from "../SERVICES/resume-file-storage.js";
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

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload a PDF resume"
                });
            }

            const parser = new PDFParse({
                data: req.file.buffer
            });

            const result = await parser.getText();
            await parser.destroy();

            // Store the original PDF in MongoDB GridFS.
            const fileId = await storeResumePDF(
                req.file.buffer,
                req.file.originalname,
                req.user.id
            );

            // Save the resume details and GridFS file reference.
            const savedResume = await Resume.create({
                owner: req.user.id,
                filename: req.file.originalname,
                fileId: fileId,
                text: result.text
            });

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

            return res.status(500).json({
                success: false,
                message: "Failed to process or save resume"
            });
        }
    });

});

resumeApp.get("/:id/file", verifyToken, async (req, res) => {
    try {
        // Validate the resume ID.
        if (!Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID"
            });
        }

        // Find the resume belonging to the logged-in user.
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

        // Stream the original PDF from GridFS.
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
