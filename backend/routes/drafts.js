const express = require("express");
const router = express.Router();
const {
  getAllDrafts,
  getDraftsByEmailId,
  insertDraft,
  updateDraft,
  deleteDraft,
} = require("../utils/dbHelpers");

// GET all drafts
router.get("/", async (req, res) => {
  try {
    const drafts = await getAllDrafts();
    res.json({ success: true, data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET drafts for specific email
router.get("/email/:emailId", async (req, res) => {
  try {
    const drafts = await getDraftsByEmailId(req.params.emailId);
    res.json({ success: true, data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Create new draft
router.post("/", async (req, res) => {
  try {
    const { emailId, subject, body, type } = req.body;

    if (!emailId || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: emailId, subject, body",
      });
    }

    const draftId = await insertDraft(emailId, subject, body, type);
    res.json({
      success: true,
      data: { id: draftId, emailId, subject, body, type },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update draft
router.put("/:id", async (req, res) => {
  try {
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: subject, body",
      });
    }

    await updateDraft(req.params.id, subject, body);
    res.json({
      success: true,
      data: { id: req.params.id, subject, body },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE draft
router.delete("/:id", async (req, res) => {
  try {
    await deleteDraft(req.params.id);
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
