const db = require("../db");
const { savePrompt } = require("../utils/dbHelpers");

const defaultPrompts = {
  categorization: `Categorize the following email into ONE category: Important, Newsletter, Spam, or To-Do.
For To-Do emails: must include a direct request requiring user action.
Respond with ONLY the category name, nothing else.`,

  actionItems: `Extract action items from the email as a JSON array.
Format: [{"task": "task description", "deadline": "specific date or ASAP"}]
If no deadline mentioned, use "ASAP".
Respond with ONLY the JSON array, no markdown, no explanation.
Example: [{"task":"Review document","deadline":"Tomorrow"},{"task":"Send report","deadline":"Friday"}]
If no action items exist, respond with: []`,

  autoReply: `Draft a polite, professional reply to this email.
Keep it brief (4-5 sentences).
Respond with ONLY the reply text, no subject line.`,
};

async function initializePrompts() {
  try {
    for (const [type, content] of Object.entries(defaultPrompts)) {
      await savePrompt(type, content);
      console.log(`✓ Initialized prompt: ${type}`);
    }
    console.log("✓ All default prompts loaded");
    process.exit(0);
  } catch (err) {
    console.error("✗ Error initializing prompts:", err);
    process.exit(1);
  }
}

initializePrompts();
