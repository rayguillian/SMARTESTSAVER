import { db } from './firebaseService';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { CACHE_DURATIONS, CACHE_STRATEGIES, CACHE_KEYS, FIREBASE_COLLECTIONS } from '../config/cache.config';

class UnifiedCacheService {
  constructor() {
    this.metrics = {
      localHits: 0,
      localMisses: 0,
      firebaseHits: 0,
      firebaseMisses: 0,
      errors: 0
    };
    this.initializeCleanupSchedule();
  }

  // Local Storage Operations with improved error handling and validation
  setLocalCache(key, data, ttl = null) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: ttl || CACHE_DURATIONS[key.split('_')[0]]
      };
      
      // Validate data before caching
      if (!this.validateCacheData(data)) {
        throw new Error('Invalid data structure for caching');
      }

      localStorage.setItem(key, JSON.stringify(cacheEntry));
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Error setting local cache:', error);
      this.handleStorageError(error);
      return false;
    }
  }

  getLocalCache(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        this.metrics.localMisses++;
        return null;
      }

      const { data, timestamp, ttl } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < ttl) {
        this.metrics.localHits++;
        return data;
      } else {
        this.metrics.localMisses++;
        localStorage.removeItem(key);
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      console.error('Error getting local cache:', error);
      return null;
    }
  }

  // Firebase Operations with retry logic
  async setFirebaseCache(collectionName, key, data, retryCount = 3) {
    if (!collectionName || typeof collectionName !== 'string') {
      console.error('Invalid collection name:', collectionName);
      return false;
    }

    try {
      const cacheRef = collection(db, collectionName);
      
      // Check for existing entries and clean them up
      const existing = await this.findExistingFirebaseEntries(collectionName, key);
      await Promise.all(existing.map(doc => deleteDoc(doc.ref)));

      await addDoc(cacheRef, {
        key,
        data,
        timestamp: serverTimestamp(),
        ttl: CACHE_DURATIONS[key.split('_')[0]] || 3600000 // 1 hour default
      });
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Error setting Firebase cache:', error);
      
      if (retryCount > 0 && error.code !== 'permission-denied') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.setFirebaseCache(collectionName, key, data, retryCount - 1);
      }
      return false;
    }
  }

  async getFirebaseCache(collectionName, key) {
    if (!collectionName || typeof collectionName !== 'string') {
      console.error('Invalid collection name:', collectionName);
      return null;
    }

    console.log('Attempting to retrieve from Firebase cache with collection:', collectionName, 'and key:', key);

    try {
      const cacheRef = collection(db, collectionName);
      const q = query(cacheRef, where('key', '==', key));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.metrics.firebaseMisses++;
        return null;
      }

      const doc = snapshot.docs[0].data();
      const timestamp = doc.timestamp?.toDate?.() || new Date(doc.timestamp);
      const age = Date.now() - timestamp.getTime();
      const ttl = doc.ttl || CACHE_DURATIONS[key.split('_')[0]] || 3600000;

      if (age < ttl) {
        this.metrics.firebaseHits++;
        return doc.data;
      } else {
        this.metrics.firebaseMisses++;
        await deleteDoc(snapshot.docs[0].ref);
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      console.error('Error getting Firebase cache:', error);
      return null;
    }
  }

  // Enhanced Unified Cache Operations
  async get(type, key, useFirebase = false) {
    if (!type || !key) {
      console.error('Invalid type or key:', { type, key });
      return null;
    }

    const cacheKey = `${CACHE_KEYS[type] || type}_${key}`;
    const strategy = CACHE_STRATEGIES[type] || 'always';
    
    // Skip cache based on strategy
    if (strategy === 'never' || (strategy === 'offline' && navigator.onLine)) {
      return null;
    }

    // Try local cache first
    const localData = this.getLocalCache(cacheKey);
    if (localData) return localData;

    // Try Firebase if enabled
    if (useFirebase) {
      const collectionName = FIREBASE_COLLECTIONS[`${type}_CACHE`] || `${type}_cache`;
      const firebaseData = await this.getFirebaseCache(collectionName, key);
      if (firebaseData) {
        // Sync to local cache
        this.setLocalCache(cacheKey, firebaseData);
        return firebaseData;
      }
    }

    return null;
  }

  async set(type, key, data, useFirebase = false) {
    if (!type || !key) {
      console.error('Invalid type or key:', { type, key });
      return false;
    }

    const cacheKey = `${CACHE_KEYS[type] || type}_${key}`;
    
    // Validate and clean data before caching
    const cleanData = this.sanitizeCacheData(data);
    
    const localSuccess = this.setLocalCache(cacheKey, cleanData);

    if (useFirebase && localSuccess) {
      const collectionName = FIREBASE_COLLECTIONS[`${type}_CACHE`] || `${type}_cache`;
      await this.setFirebaseCache(collectionName, key, cleanData);
    }

    return localSuccess;
  }

  // Helper methods
  validateCacheData(data) {
    return data != null && 
           (typeof data === 'object' || 
            Array.isArray(data) || 
            typeof data === 'string' ||
            typeof data === 'number');
  }

  sanitizeCacheData(data) {
    if (typeof data === 'object' && data !== null) {
      return JSON.parse(JSON.stringify(data));
    }
    return data;
  }

  handleStorageError(error) {
    if (error.name === 'QuotaExceededError') {
      this.cleanup(true); // Force immediate cleanup
    }
  }

  async findExistingFirebaseEntries(collectionName, key) {
    const cacheRef = collection(db, collectionName);
    const q = query(cacheRef, where('key', '==', key));
    const snapshot = await getDocs(q);
    return snapshot.docs;
  }

  initializeCleanupSchedule() {
    // Run cleanup every hour
    setInterval(() => this.cleanup(), 3600000);
  }

  // Enhanced cleanup with progress tracking
  async cleanup(force = false) {
    try {
      const cleanupStats = {
        localEntriesRemoved: 0,
        firebaseEntriesRemoved: 0
      };

      // Clean local storage
      Object.entries(CACHE_KEYS).forEach(([type, keyPrefix]) => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(keyPrefix));
        keys.forEach(key => {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, ttl } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            if (force || age > ttl) {
              localStorage.removeItem(key);
              cleanupStats.localEntriesRemoved++;
            }
          }
        });
      });

      // Clean Firebase if needed
      if (force) {
        await this.cleanupFirebase(cleanupStats);
      }

      console.log('Cache cleanup completed:', cleanupStats);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
      this.metrics.errors++;
    }
  }

  async cleanupFirebase(stats) {
    for (const collection of Object.values(FIREBASE_COLLECTIONS)) {
      const snapshot = await getDocs(collection(db, collection));
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
        const age = Date.now() - timestamp.getTime();
        if (age > data.ttl) {
          await deleteDoc(doc.ref);
          stats.firebaseEntriesRemoved++;
        }
      }
    }
  }

  getMetrics() {
    const localHitRate = this.metrics.localHits / 
      (this.metrics.localHits + this.metrics.localMisses) || 0;
    const firebaseHitRate = this.metrics.firebaseHits /
      (this.metrics.firebaseHits + this.metrics.firebaseMisses) || 0;

    return {
      ...this.metrics,
      localHitRate: localHitRate.toFixed(2),
      firebaseHitRate: firebaseHitRate.toFixed(2),
      timestamp: new Date().toISOString()
    };
  }

  resetMetrics() {
    this.metrics = {
      localHits: 0,
      localMisses: 0,
      firebaseHits: 0,
      firebaseMisses: 0,
      errors: 0
    };
  }
}

// Create singleton instance
const unifiedCacheService = new UnifiedCacheService();

// Export both default and named export for compatibility
export { unifiedCacheService };
export default unifiedCacheService;
