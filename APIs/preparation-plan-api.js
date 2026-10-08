import exp from "express";

export const preparationPlanApp = exp.Router();

preparationPlanApp.post("/", async function (req, res) {
  var goal = req.body.goal;
  if (!goal) {
    return res.status(400).json({ error: "goal is required" });
  }

  // TODO: replace with the AI call
  var plan = ["Revise Node.js fundamentals", "Practice REST API development"];

  res.json({ plan: plan });
});
