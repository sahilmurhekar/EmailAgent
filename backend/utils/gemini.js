const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Call Gemini 2.5 Flash API with a prompt and email content
const callGemini = async (emailText, userPrompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const fullPrompt = `${userPrompt}\n\n---EMAIL---\n${emailText}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("✗ Gemini API error:", error);
    throw error;
  }
};

module.exports = { callGemini };
