const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { insertEmail, getAllEmails } = require("../utils/dbHelpers");

// GET - Get mock inbox template
router.get("/template", (req, res) => {
  try {
    const mockInboxPath = path.join(__dirname, "../data/mock-inbox.json");
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
    const mockInboxPath = path.join(__dirname, "../data/mock-inbox.json");
    const mockEmails = JSON.parse(fs.readFileSync(mockInboxPath, "utf8"));

    // Clear existing emails
    const db = require("../db");
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM emails", (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    // Insert new emails
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
        message: `Successfully loaded ${results.length} emails`,
        emailCount: results.length,
        emails: results,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
        categorized: emails.filter((e) => e.category !== "Uncategorized").length,
        uncategorized: emails.filter((e) => e.category === "Uncategorized")
          .length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
