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
        return cached.data;
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
        
        if (Date.now() - data.timestamp.toDate().getTime() < CACHE_DURATION) {
          console.log('Found in Firestore cache');
          
          // Validate meals array
          if (Array.isArray(data.meals) && data.meals.length > 0) {
            // Update memory cache
            this.memoryCache.set(key, {
              data: data.meals,
              timestamp: Date.now()
            });
            return data.meals;
          } else {
            console.warn('Invalid meals data in cache, removing...');
            await deleteDoc(doc.ref);
          }
        } else {
          console.log('Cache expired, removing...');
          await deleteDoc(doc.ref);
        }
      }
    } catch (error) {
      console.warn('Error reading from Firestore cache:', error);
    }

    return null;
  }

  async cacheMeals(key, meals) {
    // Handle special cases for error and expiry caching
    if (key === 'last_api_error' || key === 'rate_limit_expiry') {
      try {
        const docRef = doc(collection(db, CACHE_COLLECTION));
        await setDoc(docRef, {
          key,
          value: meals,
          timestamp: Timestamp.now()
        });
        this.memoryCache.set(key, {
          data: meals,
          timestamp: Date.now()
        });
        return;
      } catch (error) {
        console.warn('Error writing status to cache:', error);
        return;
      }
    }

    // Validate meal data
    if (!key || typeof key !== 'string') {
      console.warn('Invalid cache key:', key);
      return;
    }

    if (!meals) {
      console.warn('Meals data is null or undefined');
      return;
    }

    if (!Array.isArray(meals)) {
      console.warn('Meals data is not an array:', typeof meals);
      return;
    }

    // Validate meal objects
    const validMeals = meals.filter(meal => {
      if (!meal || typeof meal !== 'object') return false;
      if (!meal.name || typeof meal.name !== 'string') return false;
      if (!Array.isArray(meal.ingredients)) return false;
      return true;
    });

    if (validMeals.length === 0) {
      console.warn('No valid meals in data');
      return;
    }

    // Update memory cache
    this.memoryCache.set(key, {
      data: validMeals,
      timestamp: Date.now()
    });

    // Update Firestore cache
    try {
      const docRef = doc(collection(db, CACHE_COLLECTION));
      await setDoc(docRef, {
        key,
        meals: validMeals,
        timestamp: Timestamp.now()
      });
      console.log('Successfully cached', validMeals.length, 'meals');
    } catch (error) {
      console.warn('Error writing to Firestore cache:', error);
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
