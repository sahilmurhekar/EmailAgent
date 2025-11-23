const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { pool } = require("../db");
const {
  insertEmail,
  getAllEmails,
  setAllEmailsVisible,
  hideAllEmails,
  getAllEmailsIncludingHidden
} = require("../utils/dbHelpers");

// GET - Get mock inbox template
router.get("/template", (req, res) => {
  try {
    const mockInboxPath = path.join(__dirname, "../data/mock-inbox.json");

    if (!fs.existsSync(mockInboxPath)) {
      return res.status(404).json({
        success: false,
        error: "mock-inbox.json not found",
      });
    }

    const template = JSON.parse(fs.readFileSync(mockInboxPath, "utf8"));
    res.json({
      success: true,
      data: { template, count: template.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Load mock inbox (makes emails visible)
router.post("/load", async (req, res) => {
  try {
    // Check if emails already exist
    const existingEmails = await getAllEmailsIncludingHidden();

    if (existingEmails.length > 0) {
      // If emails exist, just make them visible
      const count = await setAllEmailsVisible(true);
      console.log(`✓ Made ${count} existing emails visible`);

      const visibleEmails = await getAllEmails();
      return res.json({
        success: true,
        data: {
          message: `Successfully loaded ${visibleEmails.length} emails`,
          emailCount: visibleEmails.length,
          emails: visibleEmails.map(e => ({
            id: e.id,
            sender: e.sender,
            subject: e.subject,
          })),
        },
      });
    }

    // If no emails exist, load from mock file
    let mockInboxPath = path.join(__dirname, "../data/mock-inbox.json");

    if (!fs.existsSync(mockInboxPath)) {
      mockInboxPath = path.join(__dirname, "../../mock-inbox.json");
    }

    if (!fs.existsSync(mockInboxPath)) {
      mockInboxPath = path.join(process.cwd(), "mock-inbox.json");
    }

    if (!fs.existsSync(mockInboxPath)) {
      console.error("Mock inbox not found at any location");
      return res.status(404).json({
        success: false,
        error: "mock-inbox.json not found. Checked paths: " + mockInboxPath,
      });
    }

    console.log("Loading mock inbox from:", mockInboxPath);
    const fileContent = fs.readFileSync(mockInboxPath, "utf8");
    const mockEmails = JSON.parse(fileContent);

    if (!Array.isArray(mockEmails)) {
      return res.status(400).json({
        success: false,
        error: "mock-inbox.json must be an array of emails",
      });
    }

    // Insert new emails as visible
    const results = [];
    for (const email of mockEmails) {
      if (!email.sender || !email.subject || !email.body) {
        console.warn("Skipping invalid email:", email);
        continue;
      }

      try {
        const emailId = await insertEmail(
          email.sender,
          email.subject,
          email.body,
          "Uncategorized",
          true // Make visible immediately
        );
        results.push({
          id: emailId,
          sender: email.sender,
          subject: email.subject,
        });
      } catch (insertError) {
        console.error("Error inserting email:", insertError);
      }
    }

    console.log(`✓ Loaded ${results.length} emails`);

    res.json({
      success: true,
      data: {
        message: `Successfully loaded ${results.length} emails`,
        emailCount: results.length,
        emails: results,
      },
    });
  } catch (error) {
    console.error("Error loading inbox:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to load inbox",
    });
  }
});

// GET - Check current inbox status
router.get("/status", async (req, res) => {
  try {
    const emails = await getAllEmails();
    const allEmails = await getAllEmailsIncludingHidden();

    res.json({
      success: true,
      data: {
        visibleEmails: emails.length,
        totalEmails: allEmails.length,
        categorized: emails.filter((e) => e.category !== "Uncategorized")
          .length,
        uncategorized: emails.filter((e) => e.category === "Uncategorized")
          .length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Hide all emails (reset inbox view)
router.post("/hide", async (req, res) => {
  try {
    const count = await hideAllEmails();
    console.log(`✓ Hidden ${count} emails`);

    res.json({
      success: true,
      data: {
        message: `Successfully hidden ${count} emails`,
        hiddenCount: count,
      },
    });
  } catch (error) {
    console.error("Error hiding emails:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to hide emails",
    });
  }
});

// DELETE - Clear all emails permanently
router.delete("/clear", async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks");
    await pool.query("DELETE FROM drafts");
    await pool.query("DELETE FROM emails");
    console.log("✓ Cleared all emails and related data");

    res.json({
      success: true,
      data: {
        message: "Successfully cleared all emails",
      },
    });
  } catch (error) {
    console.error("Error clearing emails:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to clear emails",
    });
  }
});

module.exports = router;
