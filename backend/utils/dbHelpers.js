const db = require("../db");

// ===== EMAIL HELPERS =====

// Get all emails
const getAllEmails = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM emails ORDER BY created_at DESC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Get single email by ID
const getEmailById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM emails WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Insert email
const insertEmail = (sender, subject, body, category = "Uncategorized") => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO emails (sender, subject, body, category) VALUES (?, ?, ?, ?)",
      [sender, subject, body, category],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

// Update email category
const updateEmailCategory = (id, category) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE emails SET category = ? WHERE id = ?",
      [category, id],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

// ===== PROMPT HELPERS =====

// Get all prompts
const getAllPrompts = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM prompts", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Get prompt by type
const getPromptByType = (type) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM prompts WHERE type = ?", [type], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Save or update prompt
const savePrompt = (type, content) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO prompts (type, content) VALUES (?, ?)
       ON CONFLICT(type) DO UPDATE SET content = ?, updated_at = CURRENT_TIMESTAMP`,
      [type, content, content],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

// ===== DRAFT HELPERS =====

// Get all drafts
const getAllDrafts = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM drafts ORDER BY created_at DESC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Get drafts for email
const getDraftsByEmailId = (emailId) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM drafts WHERE email_id = ? ORDER BY created_at DESC",
      [emailId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

// Insert draft
const insertDraft = (emailId, subject, body, type = "reply") => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO drafts (email_id, subject, body, type) VALUES (?, ?, ?, ?)",
      [emailId, subject, body, type],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

// Update draft
const updateDraft = (id, subject, body) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE drafts SET subject = ?, body = ? WHERE id = ?",
      [subject, body, id],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

// Delete draft
const deleteDraft = (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM drafts WHERE id = ?", [id], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// Get all tasks
const getAllTasks = () => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM tasks ORDER BY deadline ASC, created_at DESC",
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

// Get tasks for specific email
const getTasksByEmailId = (emailId) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM tasks WHERE email_id = ? ORDER BY deadline ASC",
      [emailId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

// Insert task
const insertTask = (emailId, task, deadline = "ASAP") => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO tasks (email_id, task, deadline) VALUES (?, ?, ?)",
      [emailId, task, deadline],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

// Update task status (pending, completed, skipped)
const updateTaskStatus = (taskId, status) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE tasks SET status = ? WHERE id = ?",
      [status, taskId],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

// Delete task
const deleteTask = (taskId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM tasks WHERE id = ?", [taskId], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// Get tasks by status
const getTasksByStatus = (status) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM tasks WHERE status = ? ORDER BY deadline ASC",
      [status],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

// Export at end of dbHelpers.js
module.exports = {
  getAllEmails,
  getEmailById,
  insertEmail,
  updateEmailCategory,
  getAllPrompts,
  getPromptByType,
  savePrompt,
  getAllDrafts,
  getDraftsByEmailId,
  insertDraft,
  updateDraft,
  deleteDraft,getAllTasks,
  getTasksByEmailId,
  insertTask,
  updateTaskStatus,
  deleteTask,
  getTasksByStatus,
};
