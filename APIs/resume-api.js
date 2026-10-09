import exp from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";

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

resumeApp.post("/upload", (req, res) => {
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

            res.status(200).json({
                success: true,
                message: "Resume uploaded and text extracted successfully",
                filename: req.file.originalname,
                text: result.text
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to process resume",
                error: error.message
            });
        }
    });
});