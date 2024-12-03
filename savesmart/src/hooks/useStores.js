import { useState, useEffect } from 'react';
import { storeService } from '../services/storeService';

export const useStores = (userLocation, radius = 5000) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchStores = async () => {
      if (!userLocation) return;

      try {
        setLoading(true);
        setError(null);

        // Get stores from the store service
        const nearbyStores = await storeService.getNearbyStores(userLocation, radius);

        // Calculate store scores and coverage for each store
        const storesWithData = await Promise.all(
          nearbyStores.map(async (store) => {
            const storeDetails = await storeService.getStoreDetails(store.id);
            return {
              ...store,
              ...storeDetails,
              coverage: store.coverage || 0,
              distance: store.distance || 0,
              markerColor: store.markerColor || '#4CAF50'
            };
          })
        );

        if (mounted) {
          setStores(storesWithData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
        if (mounted) {
          setError('Failed to fetch store data. Please try again.');
          setLoading(false);
        }
      }
    };

    fetchStores();

    return () => {
      mounted = false;
    };
  }, [userLocation, radius]);

  const refreshStores = async () => {
    try {
      setLoading(true);
      setError(null);

      const freshStores = await storeService.refreshStoreCache(userLocation, radius);
      setStores(freshStores);
    } catch (err) {
      console.error('Error refreshing stores:', err);
      setError('Failed to refresh store data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    stores,
    loading,
    error,
    refreshStores
  };
};
