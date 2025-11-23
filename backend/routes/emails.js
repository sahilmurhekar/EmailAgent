const express = require("express");
const router = express.Router();
const {
  getAllEmails,
  getEmailById,
  insertEmail,
  updateEmailCategory,
} = require("../utils/dbHelpers");

// POST - Load mock inbox from JSON file
const fs = require("fs");
const path = require("path");

router.post("/load-mock", async (req, res) => {
  try {
    // Read mock inbox JSON
    const mockInboxPath = path.join(__dirname, "../data/mock-inbox.json");
    const mockEmails = JSON.parse(fs.readFileSync(mockInboxPath, "utf8"));

    // Clear existing emails first (optional)
    const clearEmails = () => {
      return new Promise((resolve, reject) => {
        const db = require("../db");
        db.run("DELETE FROM emails", (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
    };

    await clearEmails();

    // Insert each email
    const results = [];
    for (const email of mockEmails) {
      const emailId = await insertEmail(
        email.sender,
        email.subject,
        email.body,
        "Uncategorized"
      );
      results.push({
        id: emailId,
        sender: email.sender,
        subject: email.subject,
      });
    }

    res.json({
      success: true,
      data: {
        message: `Loaded ${results.length} emails from mock inbox`,
        emailsLoaded: results,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// GET all emails
router.get("/", async (req, res) => {
  try {
    const emails = await getAllEmails();
    res.json({ success: true, data: emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single email by ID
router.get("/:id", async (req, res) => {
  try {
    const email = await getEmailById(req.params.id);
    if (!email) {
      return res.status(404).json({ success: false, error: "Email not found" });
    }
    res.json({ success: true, data: email });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Create new email (for testing or manual entry)
router.post("/", async (req, res) => {
  try {
    const { sender, subject, body, category } = req.body;

    if (!sender || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: sender, subject, body",
      });
    }

    const emailId = await insertEmail(sender, subject, body, category);
    res.json({
      success: true,
      data: { id: emailId, sender, subject, body, category },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update email category
router.put("/:id/category", async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res
        .status(400)
        .json({ success: false, error: "Category is required" });
    }

    await updateEmailCategory(req.params.id, category);
    res.json({
      success: true,
      data: { id: req.params.id, category },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
