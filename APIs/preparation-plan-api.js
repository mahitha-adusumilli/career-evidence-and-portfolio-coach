import exp from "express";
import { verifyToken } from "../MIDDLEWARES/auth-middleware.js";

export const preparationPlanApp = exp.Router();

preparationPlanApp.post("/", verifyToken, async function (req, res) {
  try {
    var goal = req.body.goal;
    if (!goal || typeof goal !== "string" || goal.trim() === "") {
      return res.status(400).json({ error: "goal is required" });
    }

    var prompt = "You are a career coach. Give a preparation plan for this goal: " + goal + ". Return ONLY a JSON array of 4 to 6 short strings. No extra text.";

    var plan = null;

    for (var attempt = 1; attempt <= 2 && plan === null; attempt++) {
      var response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "llama3.2",
          prompt: prompt,
          stream: false
        })
      });

      var data = await response.json();
      var text = data.response || "";
      var start = text.indexOf("[");
      var end = text.lastIndexOf("]");

      if (start !== -1 && end > start) {
        try {
          plan = JSON.parse(text.substring(start, end + 1));
        } catch (parseErr) {
          plan = null;
        }
      }
    }

    if (plan === null) {
      return res.status(502).json({
        success: false,
        message: "AI returned an invalid plan, please try again"
      });
    }

    var userId = req.user ? (req.user.id || req.user._id) : req.userId;
    res.status(200).json({ plan: plan, userId: userId });
  } catch (err) {
    console.log("AI error:", err.message);
    res.status(500).json({ success: false, message: "Failed to generate plan" });
  }
});