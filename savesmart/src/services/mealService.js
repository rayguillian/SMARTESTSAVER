import { apiClient } from '../config/api';
import { mealCacheService } from './mealCacheService';

class MealService {
  constructor() {
    this.cache = mealCacheService;
  }

  async getMealSuggestions(preferences) {
    const cacheKey = JSON.stringify(preferences);

    async function generateNewMeals() {
      try {
        const response = await apiClient.post('/api/openai/chat', { 
          messages: [
            {
              role: 'system',
              content: `You are a meal planning assistant. Respond ONLY with a JSON array containing exactly 4 meal objects. 
              Each meal MUST follow this structure, no other format is allowed:
              [
                {
                  "name": "string",
                  "description": "string",
                  "ingredients": ["string"],
                  "estimatedCost": number,
                  "preparationTime": number
                }
              ]`
            },
            {
              role: 'user',
              content: `Generate exactly 4 meal suggestions based on these preferences: ${JSON.stringify(preferences)}. 
              YOUR RESPONSE MUST BE VALID JSON ONLY. DO NOT include any explanation text.`
            }
          ]
        });

        if (!response.data?.choices?.[0]?.message?.content) {
          throw new Error('Invalid response structure from API');
        }

        let suggestions;
        try {
          suggestions = JSON.parse(response.data.choices[0].message.content);
        } catch (parseError) {
          console.error('Failed to parse API response:', response.data.choices[0].message.content);
          throw new Error('Invalid JSON response from API');
        }

        if (!Array.isArray(suggestions) || suggestions.length !== 4) {
          throw new Error('Invalid response format: not an array of 4 meals');
        }

        return suggestions;
      } catch (error) {
        // Preserve the original error type
        error.isGenerationError = true;
        throw error;
      }
    }

    // Check if we're currently rate limited
    const lastError = await this.cache.getCachedMeals('last_api_error');
    const rateLimitExpiry = await this.cache.getCachedMeals('rate_limit_expiry');
    const isRateLimited = lastError === 'rate_limit' && 
                         rateLimitExpiry && 
                         new Date().getTime() < parseInt(rateLimitExpiry);

    try {
      // If we're rate limited, try cache first
      if (isRateLimited) {
        console.log('Currently rate limited, checking cache first...');
        console.log('Checking cache for meal suggestions with key:', cacheKey);
        const cached = await this.cache.getCachedMeals(cacheKey);
        if (cached?.length > 0) {
          console.log('Found valid cached meals while rate limited');
          return cached;
        }
      }

      // Try to generate new meals
      console.log('Attempting to generate new meals...');
      const newMeals = await generateNewMeals();
      
      // If successful, cache them and return
      console.log('Successfully generated new meals');
      await this.cache.cacheMeals(cacheKey, newMeals);
      await this.cache.cacheMeals('last_api_error', null);
      await this.cache.cacheMeals('rate_limit_expiry', null);
      
      return newMeals;

    } catch (error) {
      console.error('Error in meal generation:', error);

      // Handle rate limit errors
      if (error.message?.includes('rate limit') || error.response?.status === 429) {
        console.log('Rate limit hit, setting expiry...');
        const ONE_HOUR = 60 * 60 * 1000;
        await this.cache.cacheMeals('last_api_error', 'rate_limit');
        await this.cache.cacheMeals('rate_limit_expiry', new Date().getTime() + ONE_HOUR);
      }

      // For any error, try to get cached meals first
      console.log('Checking cache for fallback meals...');
      console.log('Checking cache for meal suggestions with key:', cacheKey);
      const cached = await this.cache.getCachedMeals(cacheKey);
      if (cached?.length > 0) {
        console.log('Using cached meals as fallback');
        return cached;
      }

      // Only use default meals if we really have no other option
      if (!error.isGenerationError && !isRateLimited) {
        console.log('Network or other critical error, using default meals');
        const defaultMeals = this.getDefaultMeals(preferences);
        await this.cache.cacheMeals(cacheKey, defaultMeals);
        return defaultMeals;
      }

      // If it was a generation error, throw it to be handled by the component
      throw error;
    }
  }

  getDefaultMeals(preferences) {
    const defaultMeals = [
      {
        name: "Quick Vegetarian Stir-Fry",
        description: "A healthy and quick vegetable stir-fry with tofu",
        ingredients: ["tofu", "mixed vegetables", "soy sauce", "rice"],
        estimatedTime: 20
      },
      {
        name: "Simple Pasta Marinara",
        description: "Classic Italian pasta with marinara sauce",
        ingredients: ["pasta", "marinara sauce", "olive oil", "garlic"],
        estimatedTime: 15
      },
      {
        name: "Rice and Bean Bowl",
        description: "Nutritious rice and beans with fresh herbs",
        ingredients: ["rice", "black beans", "cilantro", "lime"],
        estimatedTime: 25
      },
      {
        name: "Mediterranean Salad",
        description: "Fresh and light salad with feta cheese",
        ingredients: ["lettuce", "tomatoes", "cucumber", "feta cheese", "olives"],
        estimatedTime: 10
      }
    ];

    return this.filterMealsByPreferences(defaultMeals, preferences);
  }

  filterMealsByPreferences(meals, preferences) {
    return meals.filter(meal => {
      // Filter by cooking time
      if (preferences.maxCookingTime) {
        if (meal.estimatedTime > preferences.maxCookingTime) {
          return false;
        }
      }

      // Filter by dietary restrictions
      if (preferences.dietaryRestrictions?.length > 0) {
        const mealIngredients = new Set(meal.ingredients.map(i => i.toLowerCase()));
        const hasRestricted = preferences.dietaryRestrictions.some(restriction => {
          switch (restriction.toLowerCase()) {
            case 'vegetarian':
              return mealIngredients.has('meat') || mealIngredients.has('chicken') || mealIngredients.has('fish');
            case 'vegan':
              return mealIngredients.has('meat') || mealIngredients.has('dairy') || mealIngredients.has('egg');
            case 'gluten-free':
              return mealIngredients.has('wheat') || mealIngredients.has('pasta') || mealIngredients.has('bread');
            default:
              return false;
          }
        });
        if (hasRestricted) return false;
      }

      // Filter by allergens
      if (preferences.allergens?.length > 0) {
        const mealIngredients = new Set(meal.ingredients.map(i => i.toLowerCase()));
        if (preferences.allergens.some(allergen => mealIngredients.has(allergen.toLowerCase()))) {
          return false;
        }
      }

      return true;
    });
  }

  async invalidateMealCache(preferences) {
    await this.cache.invalidateCache(preferences);
  }

  async saveSelectedMeals(meals) {
    try {
      // Ensure meals is an array
      const mealsArray = Array.isArray(meals) ? meals : [meals];
      
      // Extract all ingredients from selected meals
      const ingredients = mealsArray.reduce((acc, meal) => {
        const mealIngredients = meal.ingredients.map(ingredient => {
          // Handle both string and object formats
          if (typeof ingredient === 'string') {
            return { name: ingredient, amount: '1', checked: false };
          }
          return { ...ingredient, checked: false };
        });
        return [...acc, ...mealIngredients];
      }, []);

      // Save selected meals to cache
      await this.cache.cacheMeals('selectedMeals', mealsArray);
      
      // Save ingredients to cache for shopping list
      await this.cache.cacheMeals('shoppingList', ingredients);

      return { meals: mealsArray, ingredients };
    } catch (error) {
      console.error('Error saving selected meals:', error);
      throw new Error('Failed to save selected meals');
    }
  }

  async getSelectedMeals() {
    try {
      return await this.cache.getCachedMeals('selectedMeals') || [];
    } catch (error) {
      console.error('Error getting selected meals:', error);
      return [];
    }
  }

  async getShoppingList() {
    try {
      return await this.cache.getCachedMeals('shoppingList') || [];
    } catch (error) {
      console.error('Error getting shopping list:', error);
      return [];
    }
  }
}

// Create and export singleton instance
export const mealService = new MealService();
