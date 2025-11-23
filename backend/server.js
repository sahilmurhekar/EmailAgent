const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import database
const db = require("./db");

// Import routes
const emailsRouter = require("./routes/emails");
const promptsRouter = require("./routes/prompts");
const draftsRouter = require("./routes/drafts");
const agentRouter = require("./routes/agent");
const inboxRouter = require("./routes/inbox");
const tasksRouter = require("./routes/tasks");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running!", timestamp: new Date() });
});

// API Routes
app.use("/api/emails", emailsRouter);
app.use("/api/prompts", promptsRouter);
app.use("/api/drafts", draftsRouter);
app.use("/api/agent", agentRouter);
app.use("/api/inbox", inboxRouter);
app.use("/api/tasks", tasksRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("✗ Server error:", err);
  res.status(500).json({ success: false, error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Database initialized`);
  console.log(`✓ All routes loaded`);
  console.log(`✓ Using Gemini 2.5 Flash API`);
});
