// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { pool, initializeTables, resetDatabase } = require("./db");
const { savePrompt, getAllPrompts } = require("./utils/dbHelpers");

// Routes
const emailsRouter = require("./routes/emails");
const promptsRouter = require("./routes/prompts");
const draftsRouter = require("./routes/drafts");
const tasksRouter = require("./routes/tasks");
const agentRouter = require("./routes/agent");
const inboxRouter = require("./routes/inbox");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ALWAYS reset + reinitialize database on every cold start
// This runs once per Lambda instance (i.e., on every refresh in your case)
(async () => {
  try {
    console.log("Resetting and reinitializing database on cold start...");
    await resetDatabase();        // ← Drops everything
    await initializeTables();     // ← Recreates tables

    // Insert default prompts
    await Promise.all([
      savePrompt("categorization", `Categorize the following email into ONE category: Important, Newsletter, Spam, or To-Do.
For To-Do emails: must include a direct request requiring user action.
Respond with ONLY the category name, nothing else.`),

      savePrompt("actionItems", `Extract action items from the email as a JSON array.
Format: [{"task": "task description", "deadline": "specific date or ASAP"}]
If no deadline mentioned, use "ASAP".
Respond with ONLY the JSON array, no markdown, no explanation.`),

      savePrompt("autoReply", `Draft a polite, professional reply to this email.
Keep it brief (2-3 sentences).
Respond with ONLY the reply text, no subject line.`),
    ]);

    console.log("Database fully reset and default prompts loaded");
  } catch (err) {
    console.error("Failed to reset/initialize database:", err);
  }
})();

// Routes
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.json({
      status: "Backend running!",
      timestamp: new Date(),
      database: "Connected",
      geminiApi: process.env.GEMINI_API_KEY ? "Configured" : "Missing",
      note: "DB resets on every cold start",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/emails", emailsRouter);
app.use("/api/prompts", promptsRouter);
app.use("/api/drafts", draftsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/agent", agentRouter);
app.use("/api/inbox", inboxRouter);

// 404 & Error handlers
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message });
});

// For local development only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\nLocal server running at http://localhost:${PORT}`);
    console.log("Database will reset on every server restart\n");
  });
}

// This is what Vercel uses
module.exports = app;
