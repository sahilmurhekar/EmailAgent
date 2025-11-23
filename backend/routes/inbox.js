// File: backend/routes/inbox.js
// Fixed version - proper error handling and JSON responses

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { insertEmail, getAllEmails } = require("../utils/dbHelpers");

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

// POST - Load mock inbox
router.post("/load", async (req, res) => {
  try {
    // Try multiple possible paths for mock-inbox.json
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

    // Get database connection
    const db = require("../db");

    // Clear existing emails
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM emails", (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    // Insert new emails
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
          "Uncategorized"
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

    res.json({
      success: true,
      data: {
        totalEmails: emails.length,
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

module.exports = router;
