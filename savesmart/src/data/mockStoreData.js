// Store chain configurations with colors and mock products
export const STORE_CHAINS = {
  'Netto': {
    color: '#FFC72C',
    icon: '🟡',
    priceLevel: 'low',
    products: {
      'milk': { price: 7.95, unit: 'L', inStock: true },
      'bread': { price: 12.95, unit: 'loaf', inStock: true },
      'eggs': { price: 24.95, unit: 'dozen', inStock: true },
      'banana': { price: 3.95, unit: 'kg', inStock: true },
      'chicken': { price: 45.95, unit: 'kg', inStock: true },
      'pasta': { price: 8.95, unit: 'pkg', inStock: true },
      'tomatoes': { price: 15.95, unit: 'kg', inStock: true },
      'onion': { price: 4.95, unit: 'kg', inStock: true },
      'garlic': { price: 2.95, unit: 'head', inStock: false },
      'cheese': { price: 25.95, unit: 'pkg', inStock: true }
    }
  },
  'Føtex': {
    color: '#0051A3',
    icon: '🔵',
    priceLevel: 'medium',
    products: {
      'milk': { price: 8.95, unit: 'L', inStock: true },
      'bread': { price: 15.95, unit: 'loaf', inStock: true },
      'eggs': { price: 27.95, unit: 'dozen', inStock: true },
      'banana': { price: 4.95, unit: 'kg', inStock: true },
      'chicken': { price: 49.95, unit: 'kg', inStock: true },
      'pasta': { price: 12.95, unit: 'pkg', inStock: true },
      'tomatoes': { price: 18.95, unit: 'kg', inStock: true },
      'onion': { price: 5.95, unit: 'kg', inStock: true },
      'garlic': { price: 3.95, unit: 'head', inStock: true },
      'cheese': { price: 29.95, unit: 'pkg', inStock: true }
    }
  },
  'Rema 1000': {
    color: '#E31837',
    icon: '🔴',
    priceLevel: 'low',
    products: {
      'milk': { price: 7.95, unit: 'L', inStock: true },
      'bread': { price: 11.95, unit: 'loaf', inStock: true },
      'eggs': { price: 23.95, unit: 'dozen', inStock: true },
      'banana': { price: 3.75, unit: 'kg', inStock: true },
      'chicken': { price: 44.95, unit: 'kg', inStock: false },
      'pasta': { price: 7.95, unit: 'pkg', inStock: true },
      'tomatoes': { price: 14.95, unit: 'kg', inStock: true },
      'onion': { price: 3.95, unit: 'kg', inStock: true },
      'garlic': { price: 2.45, unit: 'head', inStock: true },
      'cheese': { price: 24.95, unit: 'pkg', inStock: true }
    }
  },
  'Bilka': {
    color: '#004B93',
    icon: '🔵',
    priceLevel: 'low',
    products: {
      'milk': { price: 7.75, unit: 'L', inStock: true },
      'bread': { price: 11.95, unit: 'loaf', inStock: true },
      'eggs': { price: 22.95, unit: 'dozen', inStock: true },
      'banana': { price: 3.50, unit: 'kg', inStock: true },
      'chicken': { price: 43.95, unit: 'kg', inStock: true },
      'pasta': { price: 7.45, unit: 'pkg', inStock: true },
      'tomatoes': { price: 13.95, unit: 'kg', inStock: true },
      'onion': { price: 3.45, unit: 'kg', inStock: true },
      'garlic': { price: 2.25, unit: 'head', inStock: true },
      'cheese': { price: 23.95, unit: 'pkg', inStock: true }
    }
  },
  'Lidl': {
    color: '#0050AA',
    icon: '🔵',
    priceLevel: 'low',
    products: {
      'milk': { price: 7.50, unit: 'L', inStock: true },
      'bread': { price: 10.95, unit: 'loaf', inStock: true },
      'eggs': { price: 21.95, unit: 'dozen', inStock: true },
      'banana': { price: 3.25, unit: 'kg', inStock: true },
      'chicken': { price: 42.95, unit: 'kg', inStock: true },
      'pasta': { price: 7.25, unit: 'pkg', inStock: true },
      'tomatoes': { price: 12.95, unit: 'kg', inStock: true },
      'onion': { price: 3.25, unit: 'kg', inStock: true },
      'garlic': { price: 2.15, unit: 'head', inStock: true },
      'cheese': { price: 22.95, unit: 'pkg', inStock: true }
    }
  },
  'Aldi': {
    color: '#00447C',
    icon: '🔵',
    priceLevel: 'low',
    products: {
      'milk': { price: 7.45, unit: 'L', inStock: true },
      'bread': { price: 10.95, unit: 'loaf', inStock: true },
      'eggs': { price: 21.95, unit: 'dozen', inStock: true },
      'banana': { price: 3.25, unit: 'kg', inStock: true },
      'chicken': { price: 42.95, unit: 'kg', inStock: true },
      'pasta': { price: 7.25, unit: 'pkg', inStock: true },
      'tomatoes': { price: 12.95, unit: 'kg', inStock: true },
      'onion': { price: 3.25, unit: 'kg', inStock: true },
      'garlic': { price: 2.15, unit: 'head', inStock: true },
      'cheese': { price: 22.95, unit: 'pkg', inStock: true }
    }
  },
  'Irma': {
    color: '#E4032E',
    icon: '🔴',
    priceLevel: 'high',
    products: {
      'milk': { price: 9.95, unit: 'L', inStock: true },
      'bread': { price: 18.95, unit: 'loaf', inStock: true },
      'eggs': { price: 32.95, unit: 'dozen', inStock: true },
      'banana': { price: 5.95, unit: 'kg', inStock: true },
      'chicken': { price: 59.95, unit: 'kg', inStock: true },
      'pasta': { price: 13.95, unit: 'pkg', inStock: true },
      'tomatoes': { price: 19.95, unit: 'kg', inStock: true },
      'onion': { price: 5.95, unit: 'kg', inStock: true },
      'garlic': { price: 3.95, unit: 'head', inStock: true },
      'cheese': { price: 34.95, unit: 'pkg', inStock: true }
    }
  }
};

// Helper function to get store chain info
export const getStoreChainInfo = (storeName) => {
  // Try to find an exact match first
  let chainInfo = STORE_CHAINS[storeName];
  
  // If no exact match, try to find a partial match
  if (!chainInfo) {
    const chainKey = Object.keys(STORE_CHAINS).find(chain => 
      storeName.toLowerCase().includes(chain.toLowerCase())
    );
    chainInfo = chainKey ? STORE_CHAINS[chainKey] : null;
  }

  // Default values if no match found
  return chainInfo || {
    color: '#808080',
    icon: '⚪',
    priceLevel: 'unknown',
    products: {}
  };
};

// Helper function to get product price and availability for a store
export const getProductInfo = (storeName, productName) => {
  const chainInfo = getStoreChainInfo(storeName);
  return chainInfo.products[productName.toLowerCase()] || null;
};

// Helper function to find best stores for ingredients
export const findBestStoresForIngredients = (stores, ingredients) => {
  const storeScores = stores.map(store => {
    let totalPrice = 0;
    let availableItems = 0;
    let score = 0;

    ingredients.forEach(ingredient => {
      const productInfo = getProductInfo(store.name, ingredient.name);
      if (productInfo && productInfo.inStock) {
        totalPrice += productInfo.price * (ingredient.quantity || 1);
        availableItems++;
      }
    });

    // Calculate score based on price and availability
    if (availableItems > 0) {
      // Lower price and more available items = better score
      score = (availableItems / ingredients.length) * 100 - (totalPrice / 100);
    }

    return {
      store,
      score,
      totalPrice,
      availableItems
    };
  });

  // Sort stores by score (higher is better)
  return storeScores.sort((a, b) => b.score - a.score);
};
