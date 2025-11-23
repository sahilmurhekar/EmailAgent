// api/index.js
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
require("dotenv").config();

// Database imports
const { pool, initializeTables, resetDatabase } = require("../db");
const { savePrompt, getAllPrompts } = require("../utils/dbHelpers");

// Routes
const emailsRouter = require("../routes/emails");
const promptsRouter = require("../routes/prompts");
const draftsRouter = require("../routes/drafts");
const tasksRouter = require("../routes/tasks");
const agentRouter = require("../routes/agent");
const inboxRouter = require("../routes/inbox");

const app = express();

app.use(cors());
app.use(express.json());

// Logging (Vercel-friendly)
app.use((req, res, next) => {
  console.log(`[VERCEL] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== DATABASE INITIALIZATION (run once per instance) =====
let dbInitialized = false;

const initializeDatabase = async () => {
  if (dbInitialized) return;
  dbInitialized = true;

  await initializeTables();

  const prompts = await getAllPrompts();

  if (prompts.length === 0) {
    console.log("Initializing default prompts...");

    const defaultPrompts = {
      categorization: `Categorize the following email into ONE category: Important, Newsletter, Spam, or To-Do.
For To-Do emails: must include a direct request requiring user action.
Respond with ONLY the category name, nothing else.`,

      actionItems: `Extract action items from the email as a JSON array.
Format: [{"task": "task description", "deadline": "specific date or ASAP"}]
If no deadline mentioned, use "ASAP".
Respond with ONLY the JSON array.`,

      autoReply: `Draft a brief, professional reply to this email (2–3 sentences).
Respond with ONLY the reply text.`,
    };

    await Promise.all([
      savePrompt("categorization", defaultPrompts.categorization),
      savePrompt("actionItems", defaultPrompts.actionItems),
      savePrompt("autoReply", defaultPrompts.autoReply),
    ]);

    console.log("Default prompts created.");
  }
};

// Ensure DB initialization before each request
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (err) {
    console.error("DB initialization error:", err);
    res.status(500).json({ success: false, error: "Database initialization failed" });
  }
});

// ===== ROUTES =====
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.json({
      status: "Backend running on Vercel",
      timestamp: new Date(),
      database: "✓ Connected",
      geminiApi: process.env.GEMINI_API_KEY ? "✓ Configured" : "✗ Missing",
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      database: "✗ Connection failed",
      error: err.message,
    });
  }
});

// Mount routers
app.use("/api/emails", emailsRouter);
app.use("/api/prompts", promptsRouter);
app.use("/api/drafts", draftsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/agent", agentRouter);
app.use("/api/inbox", inboxRouter);

// Reset DB
app.post("/api/reset", async (req, res) => {
  try {
    await resetDatabase();
    await initializeTables();
    res.json({ success: true, message: "Database reset and tables recreated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load data
app.post("/api/load-data", async (req, res) => {
  try {
    await initializeTables();
    res.json({ success: true, message: "Tables recreated and default data loaded" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Debug
app.get("/api/debug", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    res.json({
      success: true,
      data: {
        database: "PostgreSQL",
        connected: true,
        currentTime: result.rows[0].current_time,
        env: {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Missing",
          DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
          NODE_ENV: process.env.NODE_ENV || "development",
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

// Export handler for Vercel
module.exports = serverless(app);
module.exports.handler = serverless(app);
