import exp from "express";
import { Evidence } from "../MODELS/Evidence.js";
import { verifyToken } from "../MIDDLEWARES/auth-middleware.js";

export const evidenceApp = exp.Router();

// All Evidence endpoints require a valid JWT.
evidenceApp.use(verifyToken);

evidenceApp.post("/", async (req, res, next) => {
    try {
        const { title, description, skills, projectLink } = req.body;

        const evidence = await Evidence.create({
            title,
            description,
            skills,
            projectLink,
            owner: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Evidence created successfully",
            evidence
        });
    } catch (error) {
        next(error);
    }
});

evidenceApp.get("/", async (req, res, next) => {
    try {
        const evidence = await Evidence.find({ owner: req.user.id });

        res.status(200).json({
            success: true,
            evidence
        });
    } catch (error) {
        next(error);
    }
});

evidenceApp.get("/:id", async (req, res, next) => {
    try {
        const evidence = await Evidence.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: "Evidence not found"
            });
        }

        res.status(200).json({
            success: true,
            evidence
        });
    } catch (error) {
        next(error);
    }
});

evidenceApp.put("/:id", async (req, res, next) => {
    try {
        // Only allow editable fields; never accept owner from the request body.
        const updates = {};
        for (const field of ["title", "description", "skills", "projectLink"]) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        const evidence = await Evidence.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
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
            evidence
        });
    } catch (error) {
        next(error);
    }
});

evidenceApp.delete("/:id", async (req, res, next) => {
    try {
        const evidence = await Evidence.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });

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
