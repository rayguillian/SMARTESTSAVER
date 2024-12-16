const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  cors: {
    origins: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  },
  cache: {
    stores: 1800000, // 30 minutes
    meals: 7200000   // 2 hours
  },
  openai: {
    model: "gpt-3.5-turbo",
    maxTokens: 1000,
    temperature: 0.7
  }
};

module.exports = config;