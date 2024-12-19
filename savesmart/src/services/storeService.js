import axios from 'axios';
import { getProductInfo, getStoreChainInfo, STORE_CHAINS } from '../data/mockStoreData';
import UnifiedCacheService from './unifiedCacheService';
import { mapService } from './mapService';
import { identifyStoreChain } from '../config/supermarketChains';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

// Pre-defined list of major Danish supermarket locations
const DANISH_SUPERMARKETS = {
  'Netto': [
    { lat: 56.1629, lng: 10.2039, address: 'Åboulevarden 80, 8000 Aarhus' },
    { lat: 56.1539, lng: 10.2033, address: 'Banegårdspladsen 6, 8000 Aarhus' },
    { lat: 56.1702, lng: 10.1927, address: 'Silkeborgvej 325, 8230 Åbyhøj' }
  ],
  'Føtex': [
    { lat: 56.1572, lng: 10.2107, address: 'Frederiks Alle 22, 8000 Aarhus' },
    { lat: 56.1701, lng: 10.1875, address: 'Silkeborgvej 241, 8230 Åbyhøj' },
    { lat: 56.1845, lng: 10.2234, address: 'Veri Center, 8240 Risskov' }
  ],
  'Rema 1000': [
    { lat: 56.1567, lng: 10.1991, address: 'Jægergårdsgade 64, 8000 Aarhus' },
    { lat: 56.1689, lng: 10.2034, address: 'Nørregade 42, 8000 Aarhus' },
    { lat: 56.1773, lng: 10.1873, address: 'Viborgvej 277, 8210 Aarhus' }
  ],
  'Bilka': [
    { lat: 56.1523, lng: 10.1347, address: 'Hasselager Centervej 30, 8260 Viby' },
    { lat: 56.1989, lng: 10.2176, address: 'Skejbyvej 444, 8200 Aarhus N' }
  ],
  'Lidl': [
    { lat: 56.1601, lng: 10.2107, address: 'Frederiks Alle 93, 8000 Aarhus' },
    { lat: 56.1734, lng: 10.1934, address: 'Silkeborgvej 277, 8230 Åbyhøj' }
  ],
  'Aldi': [
    { lat: 56.1589, lng: 10.2091, address: 'Frederiks Alle 89, 8000 Aarhus' },
    { lat: 56.1698, lng: 10.1867, address: 'Silkeborgvej 228, 8230 Åbyhøj' }
  ]
};

// Major Danish cities to search around for comprehensive coverage
const DANISH_CITIES = [
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683 },
  { name: 'Aarhus', lat: 56.1629, lng: 10.2039 },
  { name: 'Odense', lat: 55.4038, lng: 10.4024 },
  { name: 'Aalborg', lat: 57.0488, lng: 9.9217 },
  { name: 'Esbjerg', lat: 55.4761, lng: 8.4599 },
  { name: 'Randers', lat: 56.4607, lng: 10.0364 },
  { name: 'Kolding', lat: 55.4904, lng: 9.4707 },
  { name: 'Horsens', lat: 55.8581, lng: 9.8478 },
  { name: 'Vejle', lat: 55.7090, lng: 9.5352 },
  { name: 'Roskilde', lat: 55.6418, lng: 12.0879 }
];

// Major Danish supermarket chains with branding
const SUPERMARKET_CHAINS = {
  'netto': { 
    color: '#FFCC00', 
    icon: '🟡',
    priceLevel: 'low',
    brandColor: '#FFCC00',
    textColor: '#000000'
  },
  'føtex': { 
    color: '#001B8D', 
    icon: '🔵',
    priceLevel: 'medium',
    brandColor: '#001B8D',
    textColor: '#FFFFFF'
  },
  'bilka': { 
    color: '#0066B3', 
    icon: '🔷',
    priceLevel: 'low',
    brandColor: '#0066B3',
    textColor: '#FFFFFF'
  },
  'rema 1000': { 
    color: '#E30613', 
    icon: '🔴',
    priceLevel: 'low',
    brandColor: '#E30613',
    textColor: '#FFFFFF'
  },
  'lidl': { 
    color: '#0050AA', 
    icon: '🔵',
    priceLevel: 'low',
    brandColor: '#0050AA',
    textColor: '#FFFFFF'
  },
  'aldi': { 
    color: '#00447C', 
    icon: '🔵',
    priceLevel: 'low',
    brandColor: '#00447C',
    textColor: '#FFFFFF'
  },
  'fakta': { 
    color: '#E30613', 
    icon: '🔴',
    priceLevel: 'low',
    brandColor: '#E30613',
    textColor: '#FFFFFF'
  },
  'meny': { 
    color: '#95C11F', 
    icon: '🟢',
    priceLevel: 'high',
    brandColor: '#95C11F',
    textColor: '#000000'
  },
  'spar': { 
    color: '#00923F', 
    icon: '🟢',
    priceLevel: 'medium',
    brandColor: '#00923F',
    textColor: '#FFFFFF'
  },
  'superbrugsen': { 
    color: '#F37021', 
    icon: '🟠',
    priceLevel: 'medium',
    brandColor: '#F37021',
    textColor: '#FFFFFF'
  },
  'kvickly': { 
    color: '#E30613', 
    icon: '🔴',
    priceLevel: 'medium',
    brandColor: '#E30613',
    textColor: '#FFFFFF'
  },
  'irma': { 
    color: '#E30613', 
    icon: '🔴',
    priceLevel: 'high',
    brandColor: '#E30613',
    textColor: '#FFFFFF'
  },
  'dagli\'brugsen': { 
    color: '#F37021', 
    icon: '🟠',
    priceLevel: 'medium',
    brandColor: '#F37021',
    textColor: '#FFFFFF'
  }
};

class StoreService {
  static #instance = null;
  static storeCache = new Map();
  
  // Default location (Copenhagen city center)
  static DEFAULT_LOCATION = {
    latitude: 55.6761,
    longitude: 12.5683,
    city: 'Copenhagen'
  };

  constructor() {
    if (StoreService.#instance) {
      return StoreService.#instance;
    }
    StoreService.#instance = this;
    this.identifyStoreChain = identifyStoreChain.bind(this);
  }

  static getInstance() {
    if (!StoreService.#instance) {
      StoreService.#instance = new StoreService();
    }
    return StoreService.#instance;
  }

  async getNearbyStores(userLocation, radius = 5000) {
    try {
      // Validate location or use default
      const location = this.validateLocation(userLocation);
      
      // Try to get from cache first
      const cacheKey = `${location.latitude},${location.longitude}-${radius}`;
      const cachedStores = await UnifiedCacheService.get('STORES', cacheKey);
      
      if (cachedStores) {
        console.log('Using cached store data');
        return cachedStores;
      }

      // Call our backend proxy
      const response = await axios.get('http://localhost:3000/api/nearbyStores', {
        params: {
          userLocation: JSON.stringify(location),
          travelPreferences: JSON.stringify({ radius })
        }
      });

      if (!response.data || !response.data.stores) {
        console.warn('No stores found from API, using fallback stores');
        return this.getFallbackStores(location);
      }

      const stores = response.data.stores.map(store => ({
        id: store.place_id || `store-${Math.random()}`,
        name: store.name,
        chain: store.chain || this.identifyStoreChain(store.name),
        address: store.vicinity,
        location: {
          lat: store.geometry?.location?.lat || location.latitude,
          lng: store.geometry?.location?.lng || location.longitude
        },
        isOpen: store.opening_hours?.open_now,
        rating: store.rating,
        userRatingsTotal: store.user_ratings_total,
        distance: store.distance,
        isFallback: !!store.isFallback
      }));

      // Cache the results
      await UnifiedCacheService.set('STORES', cacheKey, stores, true);
      return stores;

    } catch (error) {
      console.error('Error fetching nearby stores:', error);
      return this.getFallbackStores(userLocation);
    }
  }

  validateLocation(userLocation) {
    // If location is completely missing or invalid, use default
    if (!userLocation || typeof userLocation !== 'object') {
      console.log('No location provided, using default Copenhagen location');
      return StoreService.DEFAULT_LOCATION;
    }

    // If location has invalid or missing coordinates, use default
    if (!this.isValidCoordinate(userLocation.latitude) || !this.isValidCoordinate(userLocation.longitude)) {
      console.log('Invalid coordinates, using default Copenhagen location');
      return StoreService.DEFAULT_LOCATION;
    }

    return userLocation;
  }

  isValidCoordinate(coord) {
    return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
  }

  getFallbackStores(location) {
    try {
      // Use validated location
      const validLocation = this.validateLocation(location);
      
      // Get all stores from DANISH_SUPERMARKETS
      const allStores = [];
      Object.entries(DANISH_SUPERMARKETS).forEach(([chainName, stores]) => {
        stores.forEach(store => {
          allStores.push({
            id: `fallback-${Math.random()}`,
            name: chainName,
            chain: chainName.toLowerCase(),
            address: store.address,
            location: {
              lat: store.lat,
              lng: store.lng
            },
            isOpen: true, // Default to true for fallback stores
            rating: 4.0,
            userRatingsTotal: 100,
            distance: this.calculateDistance(
              validLocation.latitude,
              validLocation.longitude,
              store.lat,
              store.lng
            ),
            isFallback: true
          });
        });
      });

      // Sort by distance and return top 5 stores
      return allStores
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting fallback stores:', error);
      return [];
    }
  }

  async optimizeRoute(origin, stores = [], preferences = {}) {
    try {
      console.log('Optimizing route with preferences:', preferences);
      
      if (!stores.length) {
        console.warn('No stores available for optimization');
        return [];
      }

      // For testing, assume all stores have all products
      const storesWithProducts = stores.map(store => {
        const ingredients = preferences.ingredients || [];
        const availableProducts = ingredients.map(ingredient => {
          return typeof ingredient === 'string' ? ingredient : ingredient.name;
        });
        
        return {
          ...store,
          availableProducts,
          coverage: 1.0
        };
      });

      // Sort by distance and limit by maxStores
      const selectedStores = storesWithProducts
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, preferences.maxStores || 3);

      // Return a simple route with the selected stores
      const route = {
        stores: selectedStores,
        totalDistance: selectedStores.reduce((sum, store) => sum + (store.distance || 0), 0),
        estimatedTime: selectedStores.length * 10, // 10 minutes per store
        products: selectedStores.map(store => store.availableProducts).flat()
      };

      // Cache the results
      const cacheKey = `route_${origin.lat}_${origin.lng}_${stores.map(s => s.id).join('_')}`;
      await UnifiedCacheService.set('ROUTES', cacheKey, route);
      return route;

    } catch (error) {
      console.error('Error optimizing route:', error);
      return [];
    }
  }

  async checkProductAvailability(store, ingredients = []) {
    try {
      // For testing, always return all ingredients as available
      const cacheKey = `availability_${store.id}_${ingredients.sort().join('_')}`;
      const cachedAvailability = await UnifiedCacheService.get('AVAILABILITY', cacheKey);
      if (cachedAvailability) {
        return cachedAvailability;
      }

      const availability = ingredients.map(ingredient => {
        return typeof ingredient === 'string' ? ingredient : ingredient.name;
      });

      // Cache the result briefly (5 minutes)
      await UnifiedCacheService.set('AVAILABILITY', cacheKey, availability);
      return availability;
    } catch (error) {
      console.error('Error checking product availability:', error);
      return [];
    }
  }

  async getStoreDetails(placeId) {
    try {
      const response = await axios.get(`${PLACES_API_BASE}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'opening_hours,formatted_phone_number,website',
          key: GOOGLE_API_KEY
        }
      });

      if (!response.data.result) {
        throw new Error('No details available');
      }

      return {
        openingHours: response.data.result.opening_hours?.weekday_text || [],
        phoneNumber: response.data.result.formatted_phone_number || '',
        website: response.data.result.website || ''
      };
    } catch (error) {
      console.error('Error fetching store details:', error);
      return {};
    }
  }

  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  findNearestCity(location) {
    const nearestCity = DANISH_CITIES.reduce((prev, curr) => {
      const distance = this.calculateDistance(location, curr);
      if (distance < prev.distance) {
        return { city: curr.name, distance };
      }
      return prev;
    }, { city: 'Copenhagen', distance: Infinity });
    return nearestCity.city;
  }
}

export const storeService = StoreService.getInstance();
export { StoreService };

export const fetchNearbyStores = async (latitude, longitude, radius) => {
  try {
    const response = await axios.get('http://localhost:3000/api/nearbyStores', {
      params: {
        latitude,
        longitude,
        radius
      }
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching nearby stores:', error);
    throw error;
  }
};

const getPriceRange = (level) => {
  switch (level) {
    case 0: return 'Budget';
    case 1: return 'Inexpensive';
    case 2: return 'Moderate';
    case 3: return 'Expensive';
    case 4: return 'Very Expensive';
    default: return 'Unknown';
  }
};

const getStoreType = (types) => {
  if (types.includes('supermarket')) return 'Supermarket';
  if (types.includes('convenience_store')) return 'Convenience Store';
  if (types.includes('grocery_or_supermarket')) return 'Grocery Store';
  return 'Store';
};

export const optimizeRoute = async (origin, stores, preferences) => {
  try {
    // Filter stores based on preferences
    const selectedStores = stores
      .filter(store => {
        const isOpen = store.openNow !== false; // Include if openNow is true or undefined
        const matchesPricePreference = preferences.pricePreference === 'any' || 
          (preferences.pricePreference === 'budget' && store.priceLevel <= 1) ||
          (preferences.pricePreference === 'moderate' && store.priceLevel <= 2);
        
        return isOpen && matchesPricePreference;
      })
      .slice(0, preferences.maxStores);

    if (selectedStores.length === 0) {
      throw new Error('No suitable stores found matching your preferences');
    }

    // Get optimized route
    const storeLocations = selectedStores.map(store => store.location);
    const route = await mapService.optimizeWaypoints(origin, storeLocations, preferences.transportMode);

    // Map the optimized route back to store information
    const optimizedStores = route.order.map(index => selectedStores[index]);

    // Cache the results
    const cacheKey = `route_${origin.lat}_${origin.lng}_${stores.map(s => s.id).join('_')}`;
    await UnifiedCacheService.set('ROUTES', cacheKey, {
      stores: optimizedStores,
      route: {
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        legs: route.legs
      }
    });

    return {
      stores: optimizedStores,
      route: {
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        legs: route.legs
      }
    };
  } catch (error) {
    console.error('Error optimizing route:', error);
    throw new Error('Failed to optimize shopping route');
  }
};

export const getStoreDetails = async (placeId) => {
  try {
    return await mapService.getPlaceDetails(placeId);
  } catch (error) {
    console.error('Error fetching store details:', error);
    throw new Error('Failed to fetch store details');
  }
};
