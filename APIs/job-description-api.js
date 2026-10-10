import exp from "express";

const jobDescriptionApp = exp.Router();

jobDescriptionApp.post("/job-description", (req, res) => {
    const { title, description } = req.body;

    res.json({
        success: true,
        message: "Job description received successfully",
        jobDescription: {
            title: title,
            description: description
        }
    });
});

export { jobDescriptionApp };