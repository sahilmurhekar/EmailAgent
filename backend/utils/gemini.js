const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Request queue system
class GeminiRequestQueue {
  constructor(maxConcurrent = 1, delayBetweenRequests = 1500) {
    this.queue = [];
    this.processing = 0;
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenRequests = delayBetweenRequests;
    this.lastRequestTime = 0;
  }

  async add(emailText, userPrompt) {
    return new Promise((resolve, reject) => {
      this.queue.push({ emailText, userPrompt, resolve, reject });
      this.process();
    });
  }

  async process() {
    // Don't exceed max concurrent requests
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing++;
    const { emailText, userPrompt, resolve, reject } = this.queue.shift();

    try {
      // Wait until minimum delay has passed since last request
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.delayBetweenRequests) {
        await new Promise(r =>
          setTimeout(r, this.delayBetweenRequests - timeSinceLastRequest)
        );
      }

      this.lastRequestTime = Date.now();
      console.log(`📤 Processing request from queue (${this.queue.length} remaining)`);

      const result = await this.callGemini(emailText, userPrompt);
      resolve(result);
    } catch (error) {
      console.error("❌ Queue error:", error.message);
      reject(error);
    } finally {
      this.processing--;
      // Process next item in queue
      this.process();
    }
  }

  async callGemini(emailText, userPrompt) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const fullPrompt = `${userPrompt}\n\n---EMAIL---\n${emailText}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      // Handle rate limiting with exponential backoff
      if (error.message && (error.message.includes("429") || error.message.includes("quota"))) {
        console.warn("⏳ Rate limited, waiting 6 seconds before retry...");
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Retry once
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const fullPrompt = `${userPrompt}\n\n---EMAIL---\n${emailText}`;
          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          console.log("✅ Retry successful");
          return response.text();
        } catch (retryError) {
          console.error("❌ Retry failed:", retryError.message);
          throw retryError;
        }
      }

      throw error;
    }
  }

  getQueueStatus() {
    return {
      queued: this.queue.length,
      processing: this.processing,
      total: this.queue.length + this.processing,
    };
  }
}

// Create global queue instance
const geminiQueue = new GeminiRequestQueue(
  1,     // maxConcurrent: process 1 request at a time
  1500   // delayBetweenRequests: wait 1.5 seconds between requests
);

// Export both the queue and a simple wrapper function
const callGemini = async (emailText, userPrompt) => {
  return geminiQueue.add(emailText, userPrompt);
};

const getQueueStatus = () => {
  return geminiQueue.getQueueStatus();
};

module.exports = { callGemini, getQueueStatus, geminiQueue };
