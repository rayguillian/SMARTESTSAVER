import axios from 'axios';

class CacheService {
  constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0
    };
    this.cacheConfigs = {
      store_data: {
        key: 'store_data_cache',
        timestampKey: 'store_data_timestamp',
        duration: 12 * 60 * 60 * 1000 // 12 hours
      },
      meal_suggestions: {
        key: 'meal_suggestions_cache',
        timestampKey: 'meal_suggestions_timestamp',
        duration: 24 * 60 * 60 * 1000 // 24 hours
      },
      user_preferences: {
        key: 'user_preferences_cache',
        timestampKey: 'user_preferences_timestamp',
        duration: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    };
  }

  async get(type, key) {
    const config = this.cacheConfigs[type];
    if (!config) {
      console.error(`Invalid cache type: ${type}`);
      this.metrics.errors++;
      return null;
    }

    try {
      const cachedData = localStorage.getItem(`${config.key}_${key}`);
      const timestamp = localStorage.getItem(`${config.timestampKey}_${key}`);
      
      if (cachedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < config.duration) {
          this.metrics.hits++;
          console.log(`Cache hit for type: ${type}, key: ${key}`);
          return JSON.parse(cachedData);
        }
      }
      this.metrics.misses++;
      return null;
    } catch (error) {
      console.error(`Error reading from ${type} cache:`, error);
      this.metrics.errors++;
      return null;
    }
  }

  async set(type, key, data) {
    const config = this.cacheConfigs[type];
    if (!config) {
      console.error(`Invalid cache type: ${type}`);
      this.metrics.errors++;
      return;
    }

    try {
      localStorage.setItem(`${config.key}_${key}`, JSON.stringify(data));
      localStorage.setItem(`${config.timestampKey}_${key}`, Date.now().toString());
    } catch (error) {
      console.error(`Error writing to ${type} cache:`, error);
      this.metrics.errors++;
      // If we hit storage limits, clear old entries
      if (error.name === 'QuotaExceededError') {
        this.clearOldEntries(type);
      }
    }
  }

  clearOldEntries(type) {
    const config = this.cacheConfigs[type];
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(config.key)) {
        const timestamp = localStorage.getItem(key.replace(config.key, config.timestampKey));
        if (timestamp && (now - parseInt(timestamp)) > config.duration) {
          localStorage.removeItem(key);
          localStorage.removeItem(key.replace(config.key, config.timestampKey));
        }
      }
    });
  }

  clear(type, key = null) {
    const config = this.cacheConfigs[type];
    if (!config) return;

    if (key) {
      localStorage.removeItem(`${config.key}_${key}`);
      localStorage.removeItem(`${config.timestampKey}_${key}`);
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith(config.key) || k.startsWith(config.timestampKey)) {
          localStorage.removeItem(k);
        }
      });
    }
  }

  isValid(type, key) {
    const config = this.cacheConfigs[type];
    if (!config) return false;

    const timestamp = localStorage.getItem(`${config.timestampKey}_${key}`);
    if (!timestamp) return false;
    
    const age = Date.now() - parseInt(timestamp);
    return age < config.duration;
  }

  getMetrics() {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    return {
      ...this.metrics,
      hitRate: hitRate.toFixed(2),
      timestamp: new Date().toISOString()
    };
  }

  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0
    };
  }
}

export const cacheService = new CacheService();
