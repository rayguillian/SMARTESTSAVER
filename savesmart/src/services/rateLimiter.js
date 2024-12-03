import { RateLimitError } from './errors';
import { unifiedCacheService } from './unifiedCacheService';

class RateLimiter {
  constructor() {
    this.limits = {
      'openai_meals': {
        maxRequests: 3,
        windowMs: 60000, // 1 minute
        retryAfterMs: 3600000 // 1 hour
      },
      'default': {
        maxRequests: 10,
        windowMs: 60000,
        retryAfterMs: 300000 // 5 minutes
      }
    };
    
    this.requestCounts = new Map();
    this.lastResetTime = new Map();
  }

  async checkLimit(key = 'default') {
    const cacheKey = `rate_limit:${key}`;
    const limitConfig = this.limits[key] || this.limits.default;

    try {
      // Check cached rate limit status first
      const cachedStatus = await unifiedCacheService.get('rate_limits', cacheKey);
      if (cachedStatus && cachedStatus.blocked) {
        const remainingTime = cachedStatus.resetTime - Date.now();
        if (remainingTime > 0) {
          throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(remainingTime / 1000)} seconds`);
        }
      }

      // Initialize or get current window
      if (!this.lastResetTime.has(key) || 
          Date.now() - this.lastResetTime.get(key) >= limitConfig.windowMs) {
        this.resetWindow(key);
      }

      const currentCount = this.requestCounts.get(key) || 0;
      
      if (currentCount >= limitConfig.maxRequests) {
        // We've hit the rate limit
        const resetTime = Date.now() + limitConfig.retryAfterMs;
        
        // Cache the rate limit status
        await unifiedCacheService.set('rate_limits', cacheKey, {
          blocked: true,
          resetTime: resetTime
        }, {
          expirationMs: limitConfig.retryAfterMs
        });

        throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(limitConfig.retryAfterMs / 1000)} seconds`);
      }

      // Increment request count
      this.requestCounts.set(key, currentCount + 1);
      
      // Update cache with current status
      await unifiedCacheService.set('rate_limits', cacheKey, {
        blocked: false,
        count: currentCount + 1,
        resetTime: this.lastResetTime.get(key) + limitConfig.windowMs
      });

      return true;
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      console.error('Rate limiter error:', error);
      // If there's an error checking the rate limit, we'll allow the request
      // but won't update any counters
      return true;
    }
  }

  resetWindow(key) {
    this.lastResetTime.set(key, Date.now());
    this.requestCounts.set(key, 0);
  }

  async getRemainingRequests(key = 'default') {
    const limitConfig = this.limits[key] || this.limits.default;
    const currentCount = this.requestCounts.get(key) || 0;
    return Math.max(0, limitConfig.maxRequests - currentCount);
  }

  async getTimeUntilReset(key = 'default') {
    const lastReset = this.lastResetTime.get(key);
    if (!lastReset) return 0;

    const limitConfig = this.limits[key] || this.limits.default;
    const timeUntilReset = (lastReset + limitConfig.windowMs) - Date.now();
    return Math.max(0, timeUntilReset);
  }

  async isRateLimited(key = 'default') {
    try {
      await this.checkLimit(key);
      return false;
    } catch (error) {
      if (error instanceof RateLimitError) {
        return true;
      }
      throw error;
    }
  }

  setLimit(key, config) {
    this.limits[key] = {
      ...this.limits.default,
      ...config
    };
  }
}

export const rateLimiter = new RateLimiter();
