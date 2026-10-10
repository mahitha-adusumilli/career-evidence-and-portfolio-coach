import exp from "express";

export const preparationPlanApp = exp.Router();

preparationPlanApp.post("/", async function (req, res) {
  try {
    var goal = req.body.goal;
    if (!goal) {
      return res.status(400).json({ error: "goal is required" });
    }

    var prompt = "You are a career coach. Give a preparation plan for this goal: " + goal + ". Return ONLY a JSON array of 4 to 6 short strings. No extra text.";

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
    var text = data.response;
    var start = text.indexOf("[");
    var end = text.lastIndexOf("]");
    var plan = JSON.parse(text.substring(start, end + 1));

    res.status(200).json({ plan: plan });
  } catch (err) {
    console.log("AI error:", err.message);
    res.status(500).json({ success: false, message: "Failed to generate plan" });
  }
});