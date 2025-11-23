// File: backend/scripts/resetDatabase.js
// Usage: node scripts/resetDatabase.js

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve(__dirname, "../email_agent.db");

console.log("🔄 Starting database reset...\n");

// Step 1: Delete existing database
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("✓ Deleted existing database");
} else {
  console.log("ℹ️  No existing database found");
}

// Step 2: Create new database with tables
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("✗ Error creating database:", err);
    process.exit(1);
  }
  console.log("✓ Created new database");
});

// Step 3: Create all tables
db.serialize(() => {
  // Emails table
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
      else console.log("✓ Created emails table");
    }
  );

  // Prompts table
  db.run(
    `CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("✗ Error creating prompts table:", err);
      else console.log("✓ Created prompts table");
    }
  );

  // Drafts table
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
      else console.log("✓ Created drafts table");
    }
  );

  // Tasks table
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
      else console.log("✓ Created tasks table");
    }
  );
});

// Step 4: Initialize default prompts
setTimeout(() => {
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

  let promptsInitialized = 0;

  db.serialize(() => {
    for (const [type, content] of Object.entries(defaultPrompts)) {
      db.run(
        `INSERT INTO prompts (type, content) VALUES (?, ?)`,
        [type, content],
        (err) => {
          if (err) {
            console.error(`✗ Error inserting ${type} prompt:`, err);
          } else {
            promptsInitialized++;
            console.log(`✓ Initialized ${type} prompt`);

            if (promptsInitialized === 3) {
              console.log("\n✅ Database reset complete!\n");
              db.close();
              process.exit(0);
            }
          }
        }
      );
    }
  });

  // Timeout to ensure completion
  setTimeout(() => {
    db.close();
    process.exit(0);
  }, 2000);
}, 1000);
