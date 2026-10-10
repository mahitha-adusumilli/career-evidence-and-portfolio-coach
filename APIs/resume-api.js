import exp from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { verifyToken } from "../MIDDLEWARES/auth-middleware.js";
import { Resume } from "../MODELS/resume.js";

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

            // Save the resume and link it to the logged-in user.
            const savedResume = await Resume.create({
                owner: req.user.id,
                filename: req.file.originalname,
                text: result.text
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