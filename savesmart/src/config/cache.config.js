// Cache configuration
export const CACHE_DURATIONS = {
  STORES: 12 * 60 * 60 * 1000,  // 12 hours
  MEALS: 30 * 60 * 1000,        // 30 minutes
  PREFERENCES: 24 * 60 * 60 * 1000  // 24 hours
};

export const CACHE_STRATEGIES = {
  STORES: 'always',    // Always cache store data
  MEALS: 'explicit',   // Only cache when requested
  PREFERENCES: 'local' // Keep in localStorage
};

export const CACHE_KEYS = {
  STORES: 'store_data',
  MEALS: 'meal_suggestions',
  PREFERENCES: 'user_preferences'
};

export const FIREBASE_COLLECTIONS = {
  MEAL_CACHE: 'mealSuggestionCache',
  STORE_CACHE: 'storageCache'
};

export const CACHE_CONFIG = {
  CLEANUP_THRESHOLD: 100,  // Number of entries that triggers cleanup
  MAX_CACHE_SIZE: 1000,   // Maximum number of entries in cache
  OFFLINE_FALLBACK: true, // Use cache when offline
};
