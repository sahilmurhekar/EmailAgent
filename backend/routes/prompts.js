const express = require("express");
const router = express.Router();
const {
  getAllPrompts,
  getPromptByType,
  savePrompt,
} = require("../utils/dbHelpers");

// GET all prompts
router.get("/", async (req, res) => {
  try {
    const prompts = await getAllPrompts();
    res.json({ success: true, data: prompts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET prompt by type
router.get("/:type", async (req, res) => {
  try {
    const prompt = await getPromptByType(req.params.type);
    if (!prompt) {
      return res
        .status(404)
        .json({ success: false, error: "Prompt not found" });
    }
    res.json({ success: true, data: prompt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Save or update prompt
router.post("/", async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: type, content",
      });
    }

    await savePrompt(type, content);
    res.json({ success: true, data: { type, content } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
