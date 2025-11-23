// File: api/index.js
// Vercel serverless - auto-deletes and reinitializes database on every call

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ===== DATABASE RESET ON STARTUP =====
const dbPath = path.resolve(__dirname, "../backend/email_agent.db");

// Delete database file if it exists
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log("🔄 Deleted existing database file");
  } catch (err) {
    console.error("✗ Error deleting database:", err);
  }
}

// ===== IMPORT DATABASE (reinitializes tables) =====
const db = require("../backend/db");

// Wait for database to initialize, then load prompts
setTimeout(() => {
  const { savePrompt, getAllPrompts } = require("../backend/utils/dbHelpers");

  getAllPrompts()
    .then((prompts) => {
      if (prompts.length === 0) {
        console.log("🔧 Initializing default prompts...");

        const defaultPrompts = {
          categorization: `Categorize the following email into ONE category: Important, Newsletter, Spam, or To-Do.
For To-Do emails: must include a direct request requiring user action.
Respond with ONLY the category name, nothing else.`,

          actionItems: `Extract action items from the email as a JSON array.
Format: [{"task": "task description", "deadline": "specific date or ASAP"}]
If no deadline mentioned, use "ASAP".
Respond with ONLY the JSON array, no markdown, no explanation.
Example: [{"task":"Review document","deadline":"Tomorrow"},{"task":"Send report","deadline":"Friday"}]
If no action items exist, respond with: []`,

          autoReply: `Draft a polite, professional reply to this email.
Keep it brief (2-3 sentences).
Respond with ONLY the reply text, no subject line.`,
        };

        Promise.all([
          savePrompt("categorization", defaultPrompts.categorization),
          savePrompt("actionItems", defaultPrompts.actionItems),
          savePrompt("autoReply", defaultPrompts.autoReply),
        ])
          .then(() => {
            console.log("✓ All default prompts initialized");
          })
          .catch((err) => {
            console.error("✗ Error initializing prompts:", err);
          });
      } else {
        console.log(`✓ Found ${prompts.length} existing prompts`);
      }
    })
    .catch((err) => {
      console.error("✗ Error checking prompts:", err);
    });
}, 1000);

// ===== IMPORT ROUTES =====
const emailsRouter = require("../backend/routes/emails");
const promptsRouter = require("../backend/routes/prompts");
const draftsRouter = require("../backend/routes/drafts");
const tasksRouter = require("../backend/routes/tasks");
const agentRouter = require("../backend/routes/agent");
const inboxRouter = require("../backend/routes/inbox");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "Backend running on Vercel!",
    timestamp: new Date(),
    geminiApi: process.env.GEMINI_API_KEY ? "✓ Configured" : "✗ Missing",
  });
});

// API Routes
app.use("/api/emails", emailsRouter);
app.use("/api/prompts", promptsRouter);
app.use("/api/drafts", draftsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/agent", agentRouter);
app.use("/api/inbox", inboxRouter);

// Debug endpoint
app.get("/api/debug", (req, res) => {
  res.json({
    success: true,
    data: {
      dbPath,
      dbExists: fs.existsSync(dbPath),
      cwd: process.cwd(),
      env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Missing",
        NODE_ENV: process.env.NODE_ENV || "development",
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("✗ Server error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Export for Vercel
module.exports = app;
