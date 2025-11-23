// File: backend/routes/emails.js
// Fixed version - proper error handling

const express = require("express");
const router = express.Router();
const {
  getAllEmails,
  getEmailById,
  insertEmail,
  updateEmailCategory,
} = require("../utils/dbHelpers");

// GET all emails
router.get("/", async (req, res) => {
  try {
    console.log("📧 Fetching all emails...");
    const emails = await getAllEmails();
    console.log(`✓ Found ${emails.length} emails`);

    res.json({ success: true, data: emails });
  } catch (error) {
    console.error("✗ Error fetching emails:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch emails"
    });
  }
});

// GET single email by ID
router.get("/:id", async (req, res) => {
  try {
    const email = await getEmailById(req.params.id);

    if (!email) {
      return res.status(404).json({
        success: false,
        error: "Email not found"
      });
    }

    res.json({ success: true, data: email });
  } catch (error) {
    console.error("✗ Error fetching email:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
    console.log(`✓ Created email with ID: ${emailId}`);

    res.json({
      success: true,
      data: {
        id: emailId,
        sender,
        subject,
        body,
        category: category || "Uncategorized"
      },
    });
  } catch (error) {
    console.error("✗ Error creating email:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT - Update email category
router.put("/:id/category", async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: "Category is required"
      });
    }

    await updateEmailCategory(req.params.id, category);
    console.log(`✓ Updated email ${req.params.id} category to: ${category}`);

    res.json({
      success: true,
      data: { id: req.params.id, category },
    });
  } catch (error) {
    console.error("✗ Error updating email:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
