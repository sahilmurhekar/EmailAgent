const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file path
const dbPath = path.resolve(__dirname, "email_agent.db");

// Create/open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("✗ Error opening database:", err);
  } else {
    console.log("✓ Connected to SQLite database");
  }
});

// Initialize tables
db.serialize(() => {
    db.run(
  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER NOT NULL,
    task TEXT NOT NULL,
    deadline TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id)
  )`,
  (err) => {
    if (err) console.error("✗ Error creating tasks table:", err);
    else console.log("✓ Tasks table ready");
  }
);
  // ===== EMAILS TABLE =====
  db.run(
    `CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      category TEXT DEFAULT 'Uncategorized',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("✗ Error creating emails table:", err);
      else console.log("✓ Emails table ready");
    }
  );

  // ===== PROMPTS TABLE =====
  db.run(
    `CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("✗ Error creating prompts table:", err);
      else console.log("✓ Prompts table ready");
    }
  );

  // ===== DRAFTS TABLE =====
  db.run(
    `CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id INTEGER,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT DEFAULT 'reply',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (email_id) REFERENCES emails(id)
    )`,
    (err) => {
      if (err) console.error("✗ Error creating drafts table:", err);
      else console.log("✓ Drafts table ready");
    }
  );
});

// Export database for use in other files
module.exports = db;
