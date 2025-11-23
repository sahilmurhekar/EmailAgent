
const express = require("express");
const router = express.Router();
const {
  getAllTasks,
  getTasksByEmailId,
  getTasksByStatus,
  insertTask,
  updateTaskStatus,
  deleteTask,
} = require("../utils/dbHelpers");

// GET all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await getAllTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET tasks by status
router.get("/status/:status", async (req, res) => {
  try {
    const tasks = await getTasksByStatus(req.params.status);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET tasks for specific email
router.get("/email/:emailId", async (req, res) => {
  try {
    const tasks = await getTasksByEmailId(req.params.emailId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Create task
router.post("/", async (req, res) => {
  try {
    const { emailId, task, deadline } = req.body;

    if (!emailId || !task) {
      return res.status(400).json({
        success: false,
        error: "emailId and task are required",
      });
    }

    const taskId = await insertTask(emailId, task, deadline || "ASAP");
    res.json({
      success: true,
      data: { id: taskId, emailId, task, deadline: deadline || "ASAP" },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update task status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["pending", "completed", "skipped"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Valid status required: pending, completed, or skipped",
      });
    }

    await updateTaskStatus(req.params.id, status);
    res.json({ success: true, data: { id: req.params.id, status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE task
router.delete("/:id", async (req, res) => {
  try {
    await deleteTask(req.params.id);
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
