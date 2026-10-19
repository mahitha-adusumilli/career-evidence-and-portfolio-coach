import exp from "express";
import { jobDescriptionApp } from "./APIs/job-description-api.js";

const app = exp();
app.use(exp.json());
app.use("/api", jobDescriptionApp);
app.listen(3000, () => console.log("test server running on 3000"));