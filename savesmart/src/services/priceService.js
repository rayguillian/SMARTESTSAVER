import firebaseService from './firebaseService';

// Constants for route types
export const ROUTE_TYPES = {
  CHEAPEST: 'cheapest',
  PREFERRED: 'preferred',
  BALANCED: 'balanced'
};

// Constants for route optimization weights
const ROUTE_WEIGHTS = {
  CHEAPEST: { price: 1.0, preference: 0.0, distance: 0.2 },
  PREFERRED: { price: 0.2, preference: 1.0, distance: 0.2 },
  BALANCED: { price: 0.4, preference: 0.4, distance: 0.2 }
};

export const findBestPrices = async (ingredients) => {
  try {
    // Get all products that match our ingredients
    const searchTerms = ingredients.map(ing => ing.name);
    const products = await firebaseService.getProducts(searchTerms);

    // Get prices for all found products
    const productIds = products.map(p => p.id);
    const prices = await firebaseService.getPrices(productIds);

    // Get all stores
    const stores = await firebaseService.getStores();

    // Process the data to find best prices
    const recommendations = ingredients.map(ingredient => {
      const matchingProducts = products.filter(p => 
        p.name.toLowerCase().includes(ingredient.name.toLowerCase())
      );

      const alternatives = stores.map(store => {
        const productPrices = matchingProducts
          .map(product => {
            const price = prices.find(p => 
              p.productId === product.id && 
              p.storeId === store.id
            );
            return price ? { ...product, ...price } : null;
          })
          .filter(p => p !== null);

        const bestPrice = productPrices.reduce((min, curr) => 
          curr.price < min.price ? curr : min
        , productPrices[0]);

        return {
          store: store.name,
          price: bestPrice ? bestPrice.price : null,
          unit: bestPrice ? bestPrice.unit : ingredient.unit,
          productId: bestPrice ? bestPrice.productId : null
        };
      }).filter(alt => alt.price !== null);

      const bestPrice = alternatives.reduce((min, curr) => 
        curr.price < min.price ? curr : min
      , alternatives[0]);

      return {
        ingredient: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        bestPrice,
        alternatives
      };
    });

    // Calculate summary statistics
    const summary = {
      totalSavings: calculateTotalSavings(recommendations),
      recommendedStores: findRecommendedStores(recommendations),
      averagePrices: calculateAveragePrices(recommendations)
    };

    return {
      recommendations,
      summary
    };
  } catch (error) {
    console.error('Error finding best prices:', error);
    throw error;
  }
};

export const generateOptimizedRoutes = async (ingredients, userPreferences) => {
  try {
    const prices = await findBestPrices(ingredients);
    const stores = await firebaseService.getStores();
    
    // Generate three different routes based on different optimization strategies
    const routes = {
      [ROUTE_TYPES.CHEAPEST]: await optimizeShoppingRoute(ingredients, stores, prices, ROUTE_WEIGHTS.CHEAPEST, userPreferences),
      [ROUTE_TYPES.PREFERRED]: await optimizeShoppingRoute(ingredients, stores, prices, ROUTE_WEIGHTS.PREFERRED, userPreferences),
      [ROUTE_TYPES.BALANCED]: await optimizeShoppingRoute(ingredients, stores, prices, ROUTE_WEIGHTS.BALANCED, userPreferences)
    };

    return routes;
  } catch (error) {
    console.error('Error generating optimized routes:', error);
    throw error;
  }
};

export const optimizeShoppingRoute = async (ingredients, stores, prices, weights, userPreferences) => {
  try {
    const userLocation = userPreferences?.location || { lat: 0, lng: 0 };
    
    // Calculate scores for each store
    const storeScores = stores.map(store => {
      const priceScore = calculatePriceScore(prices[store.id] || {}, ingredients);
      const preferenceScore = calculatePreferenceScore(store, userPreferences);
      const distanceScore = calculateDistanceScore(store, userLocation);

      const totalScore = (
        (weights.price * priceScore) +
        (weights.preference * preferenceScore) +
        (weights.distance * distanceScore)
      );

      return {
        store,
        totalScore,
        metrics: {
          priceScore,
          preferenceScore,
          distanceScore
        }
      };
    });

    // Sort stores by total score (highest first)
    const sortedStores = storeScores.sort((a, b) => b.totalScore - a.totalScore);

    // Assign items to stores
    const itemAssignments = await assignItemsToStores(ingredients, sortedStores.map(s => s.store), prices);
    const totalCost = await calculateTotalCost(ingredients, sortedStores.map(s => s.store), prices);

    return {
      stores: sortedStores,
      itemAssignments,
      totalCost
    };
  } catch (error) {
    console.error('Error in optimizeShoppingRoute:', error);
    throw error;
  }
};

const calculatePriceScore = (storePrices, ingredients) => {
  if (!storePrices.length) return 0;
  
  const totalPossibleItems = ingredients.length;
  const availableItems = ingredients.filter(ingredient => 
    storePrices.some(price => 
      price.productName.toLowerCase().includes(ingredient.name.toLowerCase())
    )
  ).length;
  
  const averagePrice = storePrices.reduce((acc, price) => acc + price.price, 0) / storePrices.length;
  const normalizedPrice = 1 - (averagePrice / 100); // Normalize price score (assuming max price is 100)
  
  return (availableItems / totalPossibleItems) * normalizedPrice;
};

const calculatePreferenceScore = (store, userPreferences) => {
  if (!userPreferences?.preferredStores) return 0;
  return userPreferences.preferredStores.includes(store.id) ? 1 : 0;
};

const calculateDistanceScore = (store, userLocation) => {
  if (!userLocation || !store.location) return 0;
  
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    store.location.latitude,
    store.location.longitude
  );
  
  // Normalize distance score (assuming max reasonable distance is 20km)
  return 1 - Math.min(distance / 20, 1);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

const assignItemsToStores = (ingredients, sortedStores, prices) => {
  const assignments = {};
  
  ingredients.forEach(ingredient => {
    let assigned = false;
    
    // Try to assign each ingredient to the best store that has it
    for (const storeScore of sortedStores) {
      const store = storeScore.store;
      const storePrices = prices.filter(p => p.storeId === store.id);
      
      const matchingPrice = storePrices.find(price => 
        price.productName.toLowerCase().includes(ingredient.name.toLowerCase())
      );
      
      if (matchingPrice && !assigned) {
        if (!assignments[store.id]) {
          assignments[store.id] = [];
        }
        assignments[store.id].push({
          ingredient,
          price: matchingPrice.price
        });
        assigned = true;
      }
    }
  });
  
  return assignments;
};

const calculateTotalCost = (ingredients, sortedStores, prices) => {
  const assignments = assignItemsToStores(ingredients, sortedStores, prices);
  
  return Object.values(assignments).reduce((total, storeItems) => {
    return total + storeItems.reduce((storeTotal, item) => storeTotal + item.price, 0);
  }, 0);
};

// Helper functions
const calculateTotalSavings = (recommendations) => {
  return recommendations.reduce((total, rec) => {
    if (!rec.alternatives || rec.alternatives.length < 2) return total;
    
    const highest = Math.max(...rec.alternatives.map(a => a.price));
    return total + (highest - rec.bestPrice.price);
  }, 0);
};

const findRecommendedStores = (recommendations) => {
  const storeFrequency = {};
  
  recommendations.forEach(rec => {
    if (rec.bestPrice) {
      storeFrequency[rec.bestPrice.store] = 
        (storeFrequency[rec.bestPrice.store] || 0) + 1;
    }
  });

  return Object.entries(storeFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([store]) => store);
};

const calculateAveragePrices = (recommendations) => {
  return recommendations.map(rec => ({
    ingredient: rec.ingredient,
    averagePrice: rec.alternatives.reduce((sum, alt) => 
      sum + alt.price
    , 0) / rec.alternatives.length
  }));
};
