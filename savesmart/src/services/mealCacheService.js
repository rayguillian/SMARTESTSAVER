import { db } from './firebaseService';
import { collection, query, where, getDocs, setDoc, deleteDoc, writeBatch, Timestamp, doc } from 'firebase/firestore';

const CACHE_COLLECTION = 'mealSuggestionCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class MealCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.locks = new Map();
  }

  async getCachedMeals(key) {
    if (!key) {
      console.warn('Invalid cache key');
      return null;
    }

    // Handle special cases
    if (key === 'last_api_error' || key === 'rate_limit_expiry') {
      try {
        const q = query(collection(db, CACHE_COLLECTION), where('key', '==', key));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          return data.value;
        }
      } catch (error) {
        console.warn('Error reading status from cache:', error);
      }
      return null;
    }

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Found in memory cache');
        console.log('Fetching meals from memory cache');
        return this.validateAndFormatMeals(cached.data);
      }
      this.memoryCache.delete(key);
    }

    // Then check Firestore
    try {
      const q = query(collection(db, CACHE_COLLECTION), where('key', '==', key));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        if (Date.now() - data.timestamp.toMillis() < CACHE_DURATION) {
          console.log('Found in Firestore cache');
          // Update memory cache
          this.memoryCache.set(key, {
            data: data.meals,
            timestamp: data.timestamp.toMillis()
          });
          return this.validateAndFormatMeals(data.meals);
        } else {
          // Clean up expired cache
          await deleteDoc(doc.ref);
        }
      }
    } catch (error) {
      console.warn('Error reading from cache:', error);
    }
    
    return null;
  }

  validateAndFormatMeals(meals) {
    if (!meals) return null;
    
    // If meals is already in the correct format, return it
    if (meals.meals && Array.isArray(meals.meals)) {
      return meals;
    }
    
    // If meals is an array, wrap it in the correct format
    if (Array.isArray(meals)) {
      return { meals };
    }
    
    return null;
  }

  async cacheMeals(key, meals) {
    if (!key || !meals) {
      console.warn('Invalid cache parameters');
      return false;
    }

    try {
      // Ensure meals are in the correct format
      const formattedMeals = this.validateAndFormatMeals(meals);
      if (!formattedMeals) {
        console.warn('Invalid meal format for caching');
        return false;
      }

      // Update memory cache
      this.memoryCache.set(key, {
        data: formattedMeals,
        timestamp: Date.now()
      });

      // Update Firestore
      const docRef = doc(db, CACHE_COLLECTION, key);
      await setDoc(docRef, {
        key,
        meals: formattedMeals,
        timestamp: Timestamp.now()
      });

      return true;
    } catch (error) {
      console.error('Error caching meals:', error);
      return false;
    }
  }

  async getWithLock(key, generator) {
    if (this.locks.has(key)) {
      await this.locks.get(key);
      return this.getCachedMeals(key);
    }

    const lockPromise = (async () => {
      const cached = await this.getCachedMeals(key);
      if (cached) return cached;

      const result = await generator();
      await this.cacheMeals(key, result);
      return result;
    })();

    this.locks.set(key, lockPromise);
    try {
      return await lockPromise;
    } finally {
      this.locks.delete(key);
    }
  }

  async clearExpiredCache() {
    // Clear memory cache
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp >= CACHE_DURATION) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Firestore cache
    try {
      const q = query(
        collection(db, CACHE_COLLECTION),
        where('timestamp', '<', Timestamp.fromMillis(now - CACHE_DURATION))
      );
      
      const expiredDocs = await getDocs(q);
      
      if (!expiredDocs.empty) {
        const batch = writeBatch(db);
        expiredDocs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    } catch (error) {
      console.warn('Error clearing expired Firestore cache:', error);
    }
  }

  invalidateCache() {
    this.memoryCache.clear();
    // Note: This only clears memory cache. Firestore cache remains until expired
  }
}

// Create singleton instance
const mealCacheService = new MealCacheService();

// Start periodic cache cleanup
setInterval(() => mealCacheService.clearExpiredCache(), CACHE_DURATION / 24); // Run cleanup every hour

export { MealCacheService, mealCacheService };
