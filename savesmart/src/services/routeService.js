import { storeService } from './storeService';
import { mapService } from './mapService';
import { STORE_CHAINS, getProductInfo } from '../data/mockStoreData';

// Calculate distance between two points using Haversine formula
const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateBasketPrice = (store, ingredients) => {
  let totalPrice = 0;
  let availableItems = 0;

  ingredients.forEach(ingredient => {
    const productInfo = getProductInfo(store.chainName, ingredient.name.toLowerCase());
    if (productInfo && productInfo.inStock) {
      totalPrice += productInfo.price;
      availableItems++;
    }
  });

  return {
    totalPrice,
    coverage: availableItems / ingredients.length
  };
};

const findStoresWithIngredients = async (ingredients, options) => {
  try {
    const stores = await storeService.findNearbyStores(options.userLocation, options.radius);
    
    if (!stores || stores.length === 0) {
      console.warn('No stores found in the area');
      return [];
    }

    // Calculate store scores based on ingredient availability, price, and distance
    const storesWithScores = stores.map(store => {
      const { totalPrice, coverage } = calculateBasketPrice(store, ingredients);
      const distance = calculateDistance(options.userLocation, store.location);
      
      // Calculate store score (lower is better)
      const priceScore = totalPrice * 0.4;  // 40% weight on price
      const distanceScore = distance * 0.3;  // 30% weight on distance
      const coverageScore = (1 - coverage) * 0.3;  // 30% weight on ingredient coverage
      
      const totalScore = priceScore + distanceScore + coverageScore;
      
      return {
        ...store,
        score: totalScore,
        coverage,
        totalPrice,
        distance,
        markerColor: coverage > 0.8 ? '#4CAF50' :  // Green for high coverage
                     coverage > 0.5 ? '#FFC107' :  // Yellow for medium coverage
                     '#FF5722'  // Orange for low coverage
      };
    });

    // Filter out stores with no ingredients and sort by score
    return storesWithScores
      .filter(store => store.coverage > 0)
      .sort((a, b) => a.score - b.score);
  } catch (error) {
    console.error('Error finding stores with ingredients:', error);
    return [];
  }
};

const generateRoutes = async (ingredients, options = {}) => {
  try {
    const stores = await findStoresWithIngredients(ingredients, options);
    
    if (!stores || stores.length === 0) {
      return [];
    }

    // Take only the specified number of stores
    const selectedStores = stores.slice(0, options.maxStores || 3);

    // Generate optimized routes
    const routes = [];
    const baseRoute = {
      stores: [],
      totalDistance: 0,
      totalCost: 0,
      coverage: 0,
      locations: [],
      markerColors: []
    };

    // Start from user location and find nearest store with highest coverage
    let currentLocation = options.userLocation;
    let remainingStores = [...selectedStores];
    let currentRoute = { ...baseRoute };

    while (remainingStores.length > 0) {
      // Find nearest store from current location
      const nearest = remainingStores.reduce((best, store) => {
        const distance = calculateDistance(currentLocation, store.location);
        const score = distance * 0.4 + (1 - store.coverage) * 0.6;  // Balance distance and coverage
        return (!best || score < best.score) ? { store, score } : best;
      }, null);

      if (!nearest) break;

      // Add store to route
      currentRoute.stores.push(nearest.store);
      currentRoute.locations.push(nearest.store.location);
      currentRoute.markerColors.push(nearest.store.markerColor);
      currentRoute.totalCost += nearest.store.totalPrice;
      currentRoute.coverage = Math.max(currentRoute.coverage, nearest.store.coverage);

      if (currentRoute.stores.length > 1) {
        currentRoute.totalDistance += calculateDistance(
          currentLocation,
          nearest.store.location
        );
      }

      // Update for next iteration
      currentLocation = nearest.store.location;
      remainingStores = remainingStores.filter(s => s !== nearest.store);
    }

    routes.push(currentRoute);
    return routes;
  } catch (error) {
    console.error('Error generating routes:', error);
    return [];
  }
};

export { generateRoutes };
