const { pool } = require("../db");

// ===== EMAIL HELPERS =====

const getAllEmails = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM emails WHERE visible = TRUE ORDER BY created_at DESC",
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      }
    );
  });
};

const getAllEmailsIncludingHidden = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM emails ORDER BY created_at DESC",
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      }
    );
  });
};

const getEmailById = (id) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM emails WHERE id = $1",
      [id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows[0]);
      }
    );
  });
};

const insertEmail = (sender, subject, body, category = "Uncategorized", visible = false) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "INSERT INTO emails (sender, subject, body, category, visible) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [sender, subject, body, category, visible],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows[0].id);
      }
    );
  });
};

const updateEmailCategory = (id, category) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "UPDATE emails SET category = $1 WHERE id = $2",
      [category, id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

// ===== PROMPT HELPERS =====

const getAllPrompts = () => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT * FROM prompts", (err, result) => {
      if (err) reject(err);
      else resolve(result.rows);
    });
  });
};

const getPromptByType = (type) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM prompts WHERE type = $1",
      [type],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows[0]);
      }
    );
  });
};

const savePrompt = (type, content) => {
  return new Promise((resolve, reject) => {
    pool.query(
      `INSERT INTO prompts (type, content)
       VALUES ($1, $2)
       ON CONFLICT (type)
       DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP`,
      [type, content],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

// ===== DRAFT HELPERS =====

const getAllDrafts = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM drafts ORDER BY created_at DESC",
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      }
    );
  });
};

const getDraftsByEmailId = (emailId) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM drafts WHERE email_id = $1",
      [emailId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      }
    );
  });
};

const insertDraft = (emailId, subject, body, type = "reply") => {
  return new Promise((resolve, reject) => {
    pool.query(
      "INSERT INTO drafts (email_id, subject, body, type) VALUES ($1, $2, $3, $4) RETURNING id",
      [emailId, subject, body, type],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows[0].id);
      }
    );
  });
};

const updateDraft = (id, subject, body) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "UPDATE drafts SET subject = $1, body = $2 WHERE id = $3",
      [subject, body, id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

const deleteDraft = (id) => {
  return new Promise((resolve, reject) => {
    pool.query("DELETE FROM drafts WHERE id = $1", [id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ===== TASK HELPERS =====

const getAllTasks = () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM tasks ORDER BY created_at DESC",
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      }
    );
  });
};

const getTasksByEmailId = (emailId) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM tasks WHERE email_id = $1",
      [emailId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      }
    );
  });
};

const getTasksByStatus = (status) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM tasks WHERE status = $1",
      [status],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      }
    );
  });
};

const insertTask = (emailId, task, deadline = "ASAP") => {
  return new Promise((resolve, reject) => {
    pool.query(
      "INSERT INTO tasks (email_id, task, deadline) VALUES ($1, $2, $3) RETURNING id",
      [emailId, task, deadline],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rows[0].id);
      }
    );
  });
};

const updateTaskStatus = (id, status) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "UPDATE tasks SET status = $1 WHERE id = $2",
      [status, id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

const deleteTask = (id) => {
  return new Promise((resolve, reject) => {
    pool.query("DELETE FROM tasks WHERE id = $1", [id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const setAllEmailsVisible = (visible = true) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "UPDATE emails SET visible = $1",
      [visible],
      (err, result) => {
        if (err) reject(err);
        else resolve(result.rowCount);
      }
    );
  });
};

const hideAllEmails = () => {
  return setAllEmailsVisible(false);
};

module.exports = {
  // Emails
  getAllEmails,
  getAllEmailsIncludingHidden,
  getEmailById,
  insertEmail,
  updateEmailCategory,
  setAllEmailsVisible,
  hideAllEmails,

  // Prompts
  getAllPrompts,
  getPromptByType,
  savePrompt,

  // Drafts
  getAllDrafts,
  getDraftsByEmailId,
  insertDraft,
  updateDraft,
  deleteDraft,

  // Tasks
  getAllTasks,
  getTasksByEmailId,
  getTasksByStatus,
  insertTask,
  updateTaskStatus,
  deleteTask,
};
