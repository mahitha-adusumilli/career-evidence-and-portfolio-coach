import exp from "express";
import { Evidence } from "../MODELS/Evidence.js";

export const evidenceApp = exp.Router();


// POST /api/evidence
// Add new evidence
evidenceApp.post("/", async (req, res, next) => {
    try {
        const evidence = await Evidence.create(req.body);

        res.status(201).json({
            success: true,
            message: "Evidence created successfully",
            evidence: evidence
        });
    } catch (error) {
        next(error);
    }
});


// GET /api/evidence
// Get all evidence
evidenceApp.get("/", async (req, res, next) => {
    try {
        const evidence = await Evidence.find();

        res.status(200).json({
            success: true,
            evidence: evidence
        });
    } catch (error) {
        next(error);
    }
});


// PUT /api/evidence/:id
// Update evidence
evidenceApp.put("/:id", async (req, res, next) => {
    try {
        const evidence = await Evidence.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: "Evidence not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Evidence updated successfully",
            evidence: evidence
        });
    } catch (error) {
        next(error);
    }
});


// DELETE /api/evidence/:id
// Delete evidence
evidenceApp.delete("/:id", async (req, res, next) => {
    try {
        const evidence = await Evidence.findByIdAndDelete(req.params.id);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: "Evidence not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Evidence deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});