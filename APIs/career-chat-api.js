import exp from "express";

export const careerChatApp = exp.Router();

careerChatApp.post("/", async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: "Question is required"
            });
        }

        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || "llama3.2",
                prompt: `You are a career assistant. The candidate has experience with Node.js backend development. Answer the user's question briefly and directly.

Question: ${question}`,
                stream: false
            })
        });

        const data = await response.json();

        res.status(200).json({
            response: data.response
        });

    } catch (err) {
        console.log("AI error:", err.message);

        res.status(500).json({
            success: false,
            message: "Failed to get AI response"
        });
    }
});