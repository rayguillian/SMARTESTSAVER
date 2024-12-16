const OpenAI = require('openai');
const config = require('../config');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
    });
  }

  async chatCompletion(messages) {
    return this.client.chat.completions.create({
      model: config.openai.model,
      messages,
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
      response_format: { type: "json_object" }
    });
  }

  async healthCheck() {
    return this.client.chat.completions.create({
      messages: [{ role: "user", content: "Hi, this is a test message. Please respond with 'OK'." }],
      model: config.openai.model,
      max_tokens: 5
    });
  }
}

module.exports = new OpenAIService();