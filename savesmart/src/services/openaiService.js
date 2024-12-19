import { apiClient } from '../config/api';

const CACHE_KEY = 'meal_suggestions_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const openaiService = {
  cache: new Map(),

  getCachedSuggestions(preferences) {
    const key = JSON.stringify(preferences);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Serving meal suggestions from memory cache');
      return cached.data;
    }
    return null;
  },

  setCacheSuggestions(preferences, data) {
    const key = JSON.stringify(preferences);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  async getMealSuggestions(preferences) {
    try {
      // Check memory cache first
      const cachedData = this.getCachedSuggestions(preferences);
      if (cachedData) {
        return cachedData;
      }

      // Format preferences for the API
      const formattedPreferences = {
        pricePreference: preferences.pricePreference,
        organicPreference: preferences.organicPreference,
        dietary: Object.entries(preferences.dietary)
          .filter(([_, value]) => value)
          .map(([key]) => key),
        maxStores: preferences.maxStores,
        searchRadius: preferences.searchRadius,
        travel: preferences.travel,
        maxPrepTime: preferences.maxPrepTime || "30"
      };

      const response = await apiClient.post('/api/meals/suggest', formattedPreferences);
      
      if (!response.data || !response.data.meals) {
        throw new Error('Invalid meal suggestions response');
      }

      // Cache the successful response
      this.setCacheSuggestions(preferences, response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getMealSuggestions:', error);
      throw error;
    }
  }
};
