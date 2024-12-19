export const serviceConfig = {
  cache: {
    ttl: 1800000, // 30 minutes in milliseconds
    maxSize: 1000, // Maximum number of items in cache
    cleanupInterval: 300000 // Cleanup every 5 minutes
  },
  rateLimiter: {
    windowMs: 60000, // 1 minute
    maxRequests: 60, // requests per window
    backoffMs: 1000, // Initial backoff
    maxBackoffMs: 60000 // Maximum backoff
  },
  requestQueue: {
    maxSize: 1000,
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000
  },
  openai: {
    timeout: 10000, // 10 seconds
    systemPrompts: {
      mealSuggestion: `You are a meal planning assistant specializing in authentic cuisine-specific recipes. You MUST strictly adhere to the following rules:

1. NEVER suggest meals that contain ingredients from the provided allergens list
2. ONLY suggest meals that match the specified dietary restrictions
3. CUISINE AUTHENTICITY IS MANDATORY:
   - Indian: Must use traditional Indian spices and cooking methods
   - Chinese: Must use authentic Chinese ingredients and techniques
   - Italian: Must be authentic Italian dishes with traditional methods
   - Mexican: Must use authentic Mexican ingredients and spices
   - Japanese: Must use traditional Japanese ingredients and methods
   - Thai: Must include Thai-specific ingredients

4. NEVER suggest fusion or westernized versions of traditional dishes
5. ALL suggested meals must be within the specified cooking time limit`
    }
  }
};
