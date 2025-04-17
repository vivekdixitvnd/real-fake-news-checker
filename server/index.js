// server/index.js
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { checkFact } from "./factcheck.js";
import { verifyWithNewsSources } from "./newsverify.js";
import dotenv from "dotenv";
import stringSimilarity from "string-similarity";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/check", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text cannot be empty" });
  }

  try {
    const shortText = text.split(" ").slice(0, 25).join(" ");
    const mlProcess = spawn("python", ["ml_model.py", text]);
    let mlOutput = "";

    mlProcess.stdout.on("data", (data) => {
      mlOutput += data.toString();
    });

    mlProcess.stderr.on("data", (data) => {
      console.error(`ML Error: ${data}`);
    });

    mlProcess.on("close", async () => {
      try {
        const prediction = JSON.parse(mlOutput);
        const mlLabel = prediction.label;
        const mlConfidence = prediction.confidence;

        // Parallel API calls
        const [newsResult, factResult] = await Promise.all([
          verifyWithNewsSources(shortText),
          checkFact(shortText)
        ]);

        // Initialize default values
        let finalStatus = "UNVERIFIED";
        let reason = "No match found in news sources or fact-checking tools.";

        // Check for News Match
        let similarityScore = 0;
        if (newsResult.title) {
          similarityScore = stringSimilarity.compareTwoStrings(text.toLowerCase(), newsResult.title.toLowerCase());
        }

        if (newsResult.status.includes("REAL") && similarityScore > 0.65) {
          finalStatus = "REAL (Matched with News)";
          reason = `Matched news title with ${Math.round(similarityScore * 100)}% similarity: "${newsResult.title}"`;
        }
        else if (factResult.status === "TRUE") {
          finalStatus = "REAL (Verified via Fact Check)";
          reason = `Verified by ${factResult.source}: ${factResult.rating}`;
        }
        else if (factResult.status === "FALSE") {
          finalStatus = "FAKE (Verified via Fact Check)";
          reason = `Marked FALSE by ${factResult.source}: ${factResult.rating}`;
        }
        else if (mlLabel === "Real" && mlConfidence > 0.85) {
          finalStatus = "LIKELY REAL (ML Prediction)";
          reason = `ML model predicts Real with ${(mlConfidence * 100).toFixed(2)}% confidence`;
        }
        else if (mlLabel === "Fake" && mlConfidence > 0.85) {
          finalStatus = "LIKELY FAKE (ML Prediction)";
          reason = `ML model predicts Fake with ${(mlConfidence * 100).toFixed(2)}% confidence`;
        }

        res.json({
          input: text,
          finalStatus,
          reason,
          mlStatus: mlLabel,
          mlConfidence: mlConfidence,
          newsSource: newsResult.source,
          newsLink: newsResult.link,
          newsTitle: newsResult.title,
          factCheckStatus: factResult.status,
          factCheckSource: factResult.source,
          factCheckRating: factResult.rating
        });

      } catch (jsonError) {
        console.error("Prediction JSON Error:", jsonError.message);
        res.status(500).json({ error: "Prediction parsing failed" });
      }
    });

  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () => {
  console.log("✅ Server started on http://localhost:5000");
});
