import { apiClient } from '../config/api';

const DEFAULT_MEALS = [
  // Add default meal suggestions here
];

class OpenAIService {
  async getMealSuggestions(preferences) {
    if (!preferences) {
      throw new Error('Preferences are required');
    }

    if (!preferences.cuisine?.cuisineTypes?.length) {
      throw new Error('At least one cuisine type is required');
    }

    if (!preferences.dietaryRestrictions?.length && !preferences.otherDietaryRestrictions) {
      throw new Error('At least one dietary restriction is required');
    }

    try {
      console.log('Raw preferences received:', JSON.stringify(preferences, null, 2));

      // Format preferences for the API
      const formattedPreferences = {
        dietary: {
          restrictions: [
            ...(preferences.dietaryRestrictions || []),
            ...(preferences.otherDietaryRestrictions ? [preferences.otherDietaryRestrictions] : [])
          ].filter(Boolean),
          allergens: [
            ...(preferences.allergens || []),
            ...(preferences.otherAllergens ? [preferences.otherAllergens] : [])
          ].filter(Boolean)
        },
        cuisine: {
          cuisineTypes: preferences.cuisine?.cuisineTypes || [],
          maxPrepTime: preferences.cuisine?.maxPrepTime || "60 minutes",
          difficulty: preferences.cuisine?.difficulty || "medium"
        }
      };

      // Validate the formatted preferences
      if (!formattedPreferences.cuisine.cuisineTypes.length) {
        throw new Error('No cuisine types found in formatted preferences');
      }

      if (!formattedPreferences.dietary.restrictions.length) {
        throw new Error('No dietary restrictions found in formatted preferences');
      }

      console.log('Formatted preferences:', JSON.stringify(formattedPreferences, null, 2));

      // Call the API endpoint
      const result = await apiClient.post('/api/meals/suggest', {
        preferences: formattedPreferences
      });

      console.log('API Response:', JSON.stringify(result.data, null, 2));

      if (!result.data?.meals || !Array.isArray(result.data.meals)) {
        console.error('Invalid API response:', result.data);
        throw new Error(result.data?.error?.message || 'Invalid response format from API');
      }

      // Validate meal suggestions
      const validMeals = result.data.meals.every(meal => 
        meal.name && 
        meal.description && 
        Array.isArray(meal.ingredients) && 
        meal.preparationTime && 
        meal.difficulty
      );

      if (!validMeals) {
        throw new Error('Received invalid meal data structure');
      }

      return result.data.meals;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Check if it's an API response error
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || error.response.data.error);
      }
      
      // For network errors
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      // For other errors
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
