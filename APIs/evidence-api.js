import exp from "express";
import { Evidence } from "../MODELS/Evidence.js";

export const evidenceApp = exp.Router();


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

evidenceApp.get("/:id", async (req, res, next) => {
    try {
        const evidence = await Evidence.findById(req.params.id);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: "Evidence not found"
            });
        }

        res.status(200).json({
            success: true,
            evidence: evidence
        });
    } catch (error) {
        next(error);
    }
});


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