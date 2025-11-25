const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Call Gemini API with rate limiting and better error handling
const callGemini = async (emailText, userPrompt) => {
  try {
    // Use gemini-2.0-flash instead (higher free tier limits)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const fullPrompt = `${userPrompt}\n\n---EMAIL---\n${emailText}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    // Handle rate limiting
    if (error.message && error.message.includes("429") || error.message.includes("quota")) {
      console.error("❌ Rate limit exceeded. Waiting before retry...");
      // Wait 6 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Retry once
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const fullPrompt = `${userPrompt}\n\n---EMAIL---\n${emailText}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
      } catch (retryError) {
        console.error("❌ Gemini API error after retry:", retryError);
        throw retryError;
      }
    }

    console.error("❌ Gemini API error:", error);
    throw error;
  }
};

module.exports = { callGemini };
