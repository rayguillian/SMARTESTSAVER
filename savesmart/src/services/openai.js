import { OpenAIError, RateLimitError, ValidationError } from './errors';
import { rateLimiter } from './rateLimiter';
import { requestQueue } from './requestQueue';
import { unifiedCacheService } from './unifiedCacheService';
import { apiClient } from '../config/api';

const DEFAULT_MEALS = [
  // Add default meal suggestions here
];

class OpenAIService {
  constructor() {
    this.rateLimiter = rateLimiter;
    this.requestQueue = requestQueue;
  }

  async getMealSuggestions(preferences) {
    if (!preferences) {
      throw new ValidationError('Preferences are required');
    }

    try {
      // Check rate limit before queuing request
      await this.rateLimiter.checkLimit('openai_meals');

      // Queue the request
      const response = await this.requestQueue.enqueue(
        async () => {
          try {
            // Try API call first
            const result = await apiClient.post('/api/openai/chat', {
              messages: [
                {
                  role: 'system',
                  content: await this.getSystemPrompt()
                },
                {
                  role: 'user',
                  content: this.formatUserPrompt(preferences)
                }
              ]
            });

            if (!result.data?.choices?.[0]?.message?.content) {
              throw new OpenAIError('Invalid API response structure');
            }

            const suggestions = this.parseResponse(result.data.choices[0].message.content);

            // Cache successful response with explicit collection name
            if (suggestions && suggestions.length > 0) {
              const cacheKey = this.generateCacheKey(preferences);
              await unifiedCacheService.set('meals', cacheKey, suggestions, true);
            }

            return suggestions;
          } catch (error) {
            if (error.response?.status === 429) {
              throw new RateLimitError('OpenAI rate limit exceeded');
            }

            // Try cache as a fallback
            const cacheKey = this.generateCacheKey(preferences);
            const cachedResponse = await unifiedCacheService.get('meals', cacheKey, true);

            if (cachedResponse) {
              console.log('Using cached meal suggestions as fallback');
              return cachedResponse;
            }

            // If no cache, try default suggestions
            return this.getDefaultSuggestions(preferences);
          }
        },
        { priority: 2, maxRetries: 2 }
      );

      return response;
    } catch (error) {
      console.error('Error in getMealSuggestions:', error);
      if (error instanceof RateLimitError) {
        console.warn('Rate limit hit, using default suggestions');
        return this.getDefaultSuggestions(preferences);
      }
      throw error;
    }
  }

  async getSystemPrompt() {
    try {
      const cachedPrompt = await unifiedCacheService.get('system_prompts', 'meal_assistant');
      if (cachedPrompt) {
        console.log('Using cached system prompt for meal assistant');
        return cachedPrompt;
      }

      const prompt = `You are a meal planning assistant specializing in authentic cuisine-specific recipes. You MUST strictly adhere to the following rules:

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
5. ALL suggested meals must be within the specified cooking time limit`;

      await unifiedCacheService.set('system_prompts', 'meal_assistant', prompt, {
        useFirebase: true
      });

      return prompt;
    } catch (error) {
      console.error('Error loading system prompt:', error);
      return ''; // Return empty string as fallback
    }
  }

  formatUserPrompt(preferences) {
    return JSON.stringify({
      preferences: {
        dietary: preferences.dietary || [],
        allergens: preferences.allergens || [],
        cuisineTypes: preferences.cuisineTypes || [],
        maxCookingTime: preferences.maxCookingTime || 60,
        costPreference: preferences.costPreference || 'medium'
      },
      format: {
        structure: {
          name: "string",
          description: "string",
          ingredients: "string[]",
          cookingTime: "number",
          estimatedCost: "number",
          cuisineType: "string",
          dietaryInfo: "string[]",
          authenticityMarkers: "string[]"
        }
      }
    });
  }

  parseResponse(content) {
    try {
      if (typeof content === 'string') {
        content = JSON.parse(content);
      }

      if (!Array.isArray(content)) {
        content = [content];
      }

      return content.map(meal => ({
        name: meal.name,
        description: meal.description,
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
        cookingTime: parseInt(meal.cookingTime) || 30,
        estimatedCost: parseFloat(meal.estimatedCost) || 15,
        cuisineType: meal.cuisineType || 'International',
        dietaryInfo: Array.isArray(meal.dietaryInfo) ? meal.dietaryInfo : [],
        authenticityMarkers: Array.isArray(meal.authenticityMarkers) ? meal.authenticityMarkers : []
      }));
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new OpenAIError('Failed to parse API response');
    }
  }

  generateCacheKey(preferences) {
    // Ensure preferences is an object
    const prefs = preferences || {};
    
    // Convert potential non-array values to arrays and handle null/undefined
    const toSafeArray = (value) => {
      if (Array.isArray(value)) return [...value];
      if (typeof value === 'object' && value !== null) return Object.values(value);
      return [];
    };

    const normalized = {
      dietary: toSafeArray(prefs.dietary).sort(),
      allergens: toSafeArray(prefs.allergens).sort(),
      cuisineTypes: toSafeArray(prefs.cuisineTypes).sort(),
      maxCookingTime: prefs.maxCookingTime || 60,
      costPreference: prefs.costPreference || 'medium'
    };
    
    return JSON.stringify(normalized);
  }

  getDefaultSuggestions(preferences) {
    // Return a filtered subset of default meals based on preferences
    return DEFAULT_MEALS.filter(meal => {
      if (preferences.dietary) {
        for (const [restriction, value] of Object.entries(preferences.dietary)) {
          if (value && !meal.dietaryInfo.includes(restriction)) {
            return false;
          }
        }
      }
      return true;
    }).slice(0, 4);
  }
}

export const openaiService = new OpenAIService();
