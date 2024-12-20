import { StoreService } from './storeService';

class BackgroundService {
  static async startPeriodicCacheRefresh(location) {
    // Refresh cache every 12 hours
    const REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    
    // Function to refresh cache
    const refreshCache = async () => {
      try {
        console.log('Starting periodic cache refresh...');
        await StoreService.refreshStoreCache(location);
        console.log('Cache refresh completed successfully');
      } catch (error) {
        console.error('Error during cache refresh:', error);
      }
    };

    // Initial refresh
    await refreshCache();

    // Set up periodic refresh
    setInterval(refreshCache, REFRESH_INTERVAL);
  }

  static async stopPeriodicCacheRefresh() {
    // Implementation for cleanup if needed
  }
}

export default BackgroundService;
