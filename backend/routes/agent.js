const express = require("express");
const router = express.Router();
const { callGemini, getQueueStatus } = require("../utils/gemini");
const {
  getEmailById,
  updateEmailCategory,
  getPromptByType,
  getAllEmails,
} = require("../utils/dbHelpers");

// GET - Queue status
router.get("/queue-status", (req, res) => {
  try {
    const status = getQueueStatus();
    res.json({
      success: true,
      data: {
        ...status,
        message: `${status.total} requests in queue (${status.processing} processing, ${status.queued} waiting)`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Categorize single email
router.post("/categorize/:emailId", async (req, res) => {
  try {
    const email = await getEmailById(req.params.emailId);
    if (!email) {
      return res.status(404).json({ success: false, error: "Email not found" });
    }

    const prompt = await getPromptByType("categorization");
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Categorization prompt not found" });
    }

    const emailText = `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body}`;
    const category = await callGemini(emailText, prompt.content);

    await updateEmailCategory(req.params.emailId, category.trim());

    res.json({ success: true, data: { emailId: req.params.emailId, category } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Categorize all visible emails
router.post("/categorize-all", async (req, res) => {
  try {
    const emails = await getAllEmails();
    const prompt = await getPromptByType("categorization");

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Categorization prompt not found" });
    }

    if (emails.length === 0) {
      return res.json({
        success: true,
        data: {
          categorizedCount: 0,
          results: [],
          message: "No visible emails to categorize"
        },
      });
    }

    // Queue all requests
    console.log(`📤 Queuing ${emails.length} categorization requests...`);
    const promises = emails.map(email => {
      const emailText = `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body}`;
      return callGemini(emailText, prompt.content)
        .then(category => {
          return updateEmailCategory(email.id, category.trim())
            .then(() => ({ emailId: email.id, category: category.trim() }));
        })
        .catch(error => {
          console.error(`Failed to categorize email ${email.id}:`, error.message);
          return { emailId: email.id, category: "Error", error: error.message };
        });
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => !r.error).length;

    res.json({
      success: true,
      data: {
        categorizedCount: successful,
        totalRequested: emails.length,
        results
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Extract action items from email
router.post("/extract-tasks/:emailId", async (req, res) => {
  try {
    const email = await getEmailById(req.params.emailId);
    if (!email) {
      return res.status(404).json({ success: false, error: "Email not found" });
    }

    const prompt = await getPromptByType("actionItems");
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Action items prompt not found" });
    }

    const emailText = `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body}`;
    const response = await callGemini(emailText, prompt.content);

    let tasks = [];
    const cleanResponse = response.trim();

    if (cleanResponse.startsWith("[")) {
      try {
        tasks = JSON.parse(cleanResponse);
      } catch (e) {
        const jsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            tasks = JSON.parse(jsonMatch[1]);
          } catch (e2) {
            tasks = [{ task: cleanResponse, deadline: "ASAP" }];
          }
        } else {
          tasks = [{ task: cleanResponse, deadline: "ASAP" }];
        }
      }
    } else if (cleanResponse.startsWith("{")) {
      try {
        tasks = [JSON.parse(cleanResponse)];
      } catch (e) {
        tasks = [{ task: cleanResponse, deadline: "ASAP" }];
      }
    } else {
      const taskLines = cleanResponse
        .split("\n")
        .filter((line) => line.trim().length > 0);

      tasks = taskLines.map((line) => {
        let task = line;
        let deadline = "ASAP";

        if (line.includes("(") && line.includes(")")) {
          const match = line.match(/\((.*?)\)/);
          if (match) {
            deadline = match[1];
            task = line.replace(/\s*\(.*?\)\s*/, "").trim();
          }
        }

        task = task.replace(/^[\s•\-*]+/, "").trim();
        return { task, deadline };
      });
    }

    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }

    tasks = tasks.filter((t) => {
      const taskText = typeof t === "string" ? t : t.task || t.text || "";
      return taskText.trim().length > 0;
    });

    if (tasks.length === 0) {
      return res.json({
        success: true,
        data: {
          emailId: req.params.emailId,
          tasksExtracted: 0,
          tasks: [],
          message: "No action items found in this email",
        },
      });
    }

    const { insertTask } = require("../utils/dbHelpers");
    const savedTasks = [];

    for (const t of tasks) {
      const taskText = typeof t === "string" ? t : t.task || t.text || t;
      const taskDeadline =
        typeof t === "object" ? (t.deadline || t.due_date || "ASAP") : "ASAP";

      if (taskText && !taskText.includes("json")) {
        try {
          const taskId = await insertTask(req.params.emailId, taskText, taskDeadline);
          savedTasks.push({
            id: taskId,
            task: taskText,
            deadline: taskDeadline,
          });
        } catch (dbError) {
          console.error("Error saving task:", dbError);
        }
      }
    }

    res.json({
      success: true,
      data: {
        emailId: req.params.emailId,
        tasksExtracted: savedTasks.length,
        tasks: savedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Generate auto-reply draft
router.post("/draft-reply/:emailId", async (req, res) => {
  try {
    const email = await getEmailById(req.params.emailId);
    if (!email) {
      return res.status(404).json({ success: false, error: "Email not found" });
    }

    const prompt = await getPromptByType("autoReply");
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Auto-reply prompt not found" });
    }

    const emailText = `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body}`;
    const replyBody = await callGemini(emailText, prompt.content);

    const subject = `Re: ${email.subject}`;

    res.json({
      success: true,
      data: { emailId: req.params.emailId, subject, body: replyBody },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Custom agent query (for chat)
router.post("/query/:emailId", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: "Query is required" });
    }

    const email = await getEmailById(req.params.emailId);
    if (!email) {
      return res.status(404).json({ success: false, error: "Email not found" });
    }

    const emailText = `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body}`;
    const response = await callGemini(emailText, query);

    res.json({ success: true, data: { emailId: req.params.emailId, response } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
