import exp from "express"
import { connect } from 'mongoose';
import { config } from 'dotenv';
config({ quiet: true }); //process.env

import { basicApp } from "./APIs/basic-api.js";
import { authApp } from "./APIs/auth-api.js";
import { resumeApp } from "./APIs/resume-api.js";
import { careerChatApp } from "./APIs/career-chat-api.js";
import { preparationPlanApp } from "./APIs/preparation-plan-api.js";
import { jobDescriptionApp } from "./APIs/job-description-api.js";
import { evidenceApp } from "./APIs/evidence-api.js";
//http server
const app = exp();

//body parser middleware
app.use(exp.json());

// APIs
app.use("/basic-api", basicApp);
app.use("/api/auth", authApp);
app.use("/api/resume", resumeApp);
app.use("/api/career-chat", careerChatApp);
app.use("/api/preparation-plan", preparationPlanApp);
app.use("/api", jobDescriptionApp);
app.use("/api/evidence", evidenceApp);

//env variables
const port = process.env.port;
const db_url = process.env.db_url;

//connect to database
async function connectDB() {
    try {
        await connect(db_url);
        console.log("database connection successful");

        app.listen(port, () => {
            console.log(`server listening on port ${port}`)
        });
    } catch (err) {
        console.log("error in connecting to database: ", err.message);
    }
}

connectDB();

//ERM

app.use((error, req, res, next) => {
    console.log("error! : ", error.message);

    // Mongoose validation errors
    if (error.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // Invalid MongoDB ObjectId
    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid evidence ID"
        });
    }

    // Invalid JSON request body
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    // Other unexpected errors
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});
