import exp from "express";

const jobDescriptionApp = exp.Router();

jobDescriptionApp.post("/job-description", (req, res) => {
    const { title, description } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            success: false,
            message: "Job title is required"
        });
    }

    if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
            success: false,
            message: "Job description is required"
        });
    }

    res.status(200).json({
        success: true,
        message: "Job description received successfully",
        jobDescription: {
            title: title.trim(),
            description: description.trim()
        }
    });
});

export { jobDescriptionApp };