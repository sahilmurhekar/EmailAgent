const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import database
const { pool, initializeTables } = require("./db");
const {resetDatabase} = require("./db");
const { savePrompt, getAllPrompts } = require("./utils/dbHelpers");

// Import routes
const emailsRouter = require("./routes/emails");
const promptsRouter = require("./routes/prompts");
const draftsRouter = require("./routes/drafts");
const tasksRouter = require("./routes/tasks");
const agentRouter = require("./routes/agent");
const inboxRouter = require("./routes/inbox");



const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== INITIALIZE DATABASE =====
const initializeDatabase = async () => {
  try {
    // Initialize tables
    await initializeTables();

    // Check and initialize prompts
    const prompts = await getAllPrompts();

    if (prompts.length === 0) {
      console.log("📝 Initializing default prompts...");

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

      await Promise.all([
        savePrompt("categorization", defaultPrompts.categorization),
        savePrompt("actionItems", defaultPrompts.actionItems),
        savePrompt("autoReply", defaultPrompts.autoReply),
      ]);

      console.log("✓ All default prompts initialized");
    } else {
      console.log(`✓ Found ${prompts.length} existing prompts`);
    }
  } catch (err) {
    console.error("✗ Error initializing database:", err);
    throw err;
  }
};

// ===== ROUTES =====

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({
      status: "Backend running!",
      timestamp: new Date(),
      database: "✓ Connected",
      geminiApi: process.env.GEMINI_API_KEY ? "✓ Configured" : "✗ Missing",
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      database: "✗ Connection failed",
      error: err.message
    });
  }
});

// API Routes
app.use("/api/emails", emailsRouter);
app.use("/api/prompts", promptsRouter);
app.use("/api/drafts", draftsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/agent", agentRouter);
app.use("/api/inbox", inboxRouter);

// Reset DB on demand
app.post("/api/reset", async (req, res) => {
  try {
   await resetDatabase();
await initializeTables();   // 👈 recreate tables immediately
res.json({ success: true, message: "Database reset and tables recreated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Load data (recreate tables + default prompts)
app.post("/api/load-data", async (req, res) => {
  try {
    await initializeTables();
    res.json({ success: true, message: "Tables recreated and default data loaded" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Debug endpoint
app.get("/api/debug", async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
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
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
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

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log("\n================================");
      console.log(`✓ Backend server running on http://localhost:${PORT}`);
      console.log(`✓ Database connected (PostgreSQL/Supabase)`);
      console.log(`✓ All routes loaded`);
      console.log(`✓ Using Gemini 2.5 Flash API`);
      console.log("================================\n");

      if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️  WARNING: GEMINI_API_KEY not set in environment!");
      }
      if (!process.env.DATABASE_URL) {
        console.warn("⚠️  WARNING: DATABASE_URL not set in environment!");
      }
    });
  } catch (err) {
    console.error("✗ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
