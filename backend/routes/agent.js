const express = require("express");
const router = express.Router();
const { callGemini } = require("../utils/gemini");
const {
  getEmailById,
  updateEmailCategory,
  getPromptByType,
  getAllEmails, // This now only gets visible emails
} = require("../utils/dbHelpers");

// Add this to your agent routes
const requestQueue = [];
let processing = false;

const queueGeminiCall = async (emailText, userPrompt) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ emailText, userPrompt, resolve, reject });
    processQueue();
  });
};

const processQueue = async () => {
  if (processing || requestQueue.length === 0) return;

  processing = true;
  const { emailText, userPrompt, resolve, reject } = requestQueue.shift();

  try {
    const result = await callGemini(emailText, userPrompt);
    resolve(result);
  } catch (error) {
    reject(error);
  }

  // Wait 1 second between requests
  setTimeout(() => {
    processing = false;
    processQueue();
  }, 1000);
};

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
    const emails = await getAllEmails(); // Only gets visible emails
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

    const results = [];
    for (const email of emails) {
      const emailText = `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body}`;
      const category = await callGemini(emailText, prompt.content);
      await updateEmailCategory(email.id, category.trim());
      results.push({ emailId: email.id, category: category.trim() });
    }

    res.json({
      success: true,
      data: { categorizedCount: results.length, results },
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

    // Parse the response more carefully
    let tasks = [];
    const cleanResponse = response.trim();

    // Try to extract JSON from response
    if (cleanResponse.startsWith("[")) {
      try {
        tasks = JSON.parse(cleanResponse);
      } catch (e) {
        // If JSON parsing fails, try to extract from markdown code blocks
        const jsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            tasks = JSON.parse(jsonMatch[1]);
          } catch (e2) {
            // Fallback: create single task from response
            tasks = [{ task: cleanResponse, deadline: "ASAP" }];
          }
        } else {
          // Fallback: create single task from response
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
      // Response is plain text, convert to task format
      const taskLines = cleanResponse
        .split("\n")
        .filter((line) => line.trim().length > 0);

      tasks = taskLines.map((line) => {
        // Try to extract deadline from line
        let task = line;
        let deadline = "ASAP";

        // Check for common deadline patterns
        if (line.includes("(") && line.includes(")")) {
          const match = line.match(/\((.*?)\)/);
          if (match) {
            deadline = match[1];
            task = line.replace(/\s*\(.*?\)\s*/, "").trim();
          }
        }

        // Remove bullet points and dashes
        task = task.replace(/^[\s•\-*]+/, "").trim();

        return { task, deadline };
      });
    }

    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }

    // Filter out empty tasks
    tasks = tasks.filter((t) => {
      const taskText = typeof t === "string" ? t : t.task || t.text || "";
      return taskText.trim().length > 0;
    });

    // If no tasks found, return error
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

    // Save tasks to database
    const { insertTask } = require("../utils/dbHelpers");
    const savedTasks = [];

    for (const t of tasks) {
      const taskText = typeof t === "string" ? t : t.task || t.text || t;
      const taskDeadline =
        typeof t === "object" ? (t.deadline || t.due_date || "ASAP") : "ASAP";

      // Only save if task is not just JSON text
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
