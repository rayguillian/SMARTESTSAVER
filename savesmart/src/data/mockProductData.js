// Mock product data for Danish supermarkets
const PRODUCT_DATABASE = {
  'milk': {
    'netto': { price: 8.95, inStock: true },
    'føtex': { price: 9.95, inStock: true },
    'bilka': { price: 8.75, inStock: true },
    'rema 1000': { price: 8.95, inStock: true },
    'lidl': { price: 8.50, inStock: true },
    'aldi': { price: 8.45, inStock: true },
    'fakta': { price: 8.95, inStock: true },
    'meny': { price: 10.95, inStock: true },
    'spar': { price: 9.95, inStock: true },
    'superbrugsen': { price: 9.95, inStock: true },
    'kvickly': { price: 9.95, inStock: true },
    'irma': { price: 11.95, inStock: true },
    'dagli\'brugsen': { price: 9.95, inStock: true }
  },
  'bread': {
    'netto': { price: 12.95, inStock: true },
    'føtex': { price: 14.95, inStock: true },
    'bilka': { price: 12.75, inStock: true },
    'rema 1000': { price: 12.95, inStock: true },
    'lidl': { price: 11.95, inStock: true },
    'aldi': { price: 11.95, inStock: true },
    'fakta': { price: 12.95, inStock: true },
    'meny': { price: 16.95, inStock: true },
    'spar': { price: 14.95, inStock: true },
    'superbrugsen': { price: 14.95, inStock: true },
    'kvickly': { price: 14.95, inStock: true },
    'irma': { price: 18.95, inStock: true },
    'dagli\'brugsen': { price: 14.95, inStock: true }
  },
  'eggs': {
    'netto': { price: 24.95, inStock: true },
    'føtex': { price: 26.95, inStock: true },
    'bilka': { price: 24.75, inStock: true },
    'rema 1000': { price: 24.95, inStock: true },
    'lidl': { price: 23.95, inStock: true },
    'aldi': { price: 23.95, inStock: true },
    'fakta': { price: 24.95, inStock: true },
    'meny': { price: 28.95, inStock: true },
    'spar': { price: 26.95, inStock: true },
    'superbrugsen': { price: 26.95, inStock: true },
    'kvickly': { price: 26.95, inStock: true },
    'irma': { price: 32.95, inStock: true },
    'dagli\'brugsen': { price: 26.95, inStock: true }
  },
  // Add more common grocery items with realistic Danish prices
  'cheese': {
    'netto': { price: 32.95, inStock: true },
    'føtex': { price: 34.95, inStock: true },
    'bilka': { price: 32.75, inStock: true },
    'rema 1000': { price: 32.95, inStock: true },
    'lidl': { price: 31.95, inStock: true },
    'aldi': { price: 31.95, inStock: true },
    'fakta': { price: 32.95, inStock: true },
    'meny': { price: 38.95, inStock: true },
    'spar': { price: 34.95, inStock: true },
    'superbrugsen': { price: 34.95, inStock: true },
    'kvickly': { price: 34.95, inStock: true },
    'irma': { price: 42.95, inStock: true },
    'dagli\'brugsen': { price: 34.95, inStock: true }
  }
};

// Function to get product price and availability
export const getProductPrice = (storeName, productName) => {
  const normalizedStore = storeName.toLowerCase();
  const normalizedProduct = productName.toLowerCase();
  
  if (PRODUCT_DATABASE[normalizedProduct] && PRODUCT_DATABASE[normalizedProduct][normalizedStore]) {
    return PRODUCT_DATABASE[normalizedProduct][normalizedStore];
  }
  
  // Return a random price if product not found (for testing)
  return {
    price: Math.floor(Math.random() * (50 - 10) + 10),
    inStock: Math.random() > 0.2 // 80% chance of being in stock
  };
};

// Function to get all products for a store
export const getStoreProducts = (storeName) => {
  const normalizedStore = storeName.toLowerCase();
  const products = {};
  
  Object.entries(PRODUCT_DATABASE).forEach(([productName, storeData]) => {
    if (storeData[normalizedStore]) {
      products[productName] = storeData[normalizedStore];
    }
  });
  
  return products;
};

// Function to get price comparison for a product across all stores
export const comparePrices = (productName) => {
  const normalizedProduct = productName.toLowerCase();
  if (!PRODUCT_DATABASE[normalizedProduct]) return null;
  
  return Object.entries(PRODUCT_DATABASE[normalizedProduct])
    .map(([store, data]) => ({
      store,
      ...data
    }))
    .sort((a, b) => a.price - b.price);
};

// Function to find cheapest store for a list of products
export const findCheapestStore = (products) => {
  const storeTotals = {};
  
  products.forEach(product => {
    const normalizedProduct = product.toLowerCase();
    if (PRODUCT_DATABASE[normalizedProduct]) {
      Object.entries(PRODUCT_DATABASE[normalizedProduct]).forEach(([store, data]) => {
        if (!storeTotals[store]) {
          storeTotals[store] = { total: 0, available: 0 };
        }
        if (data.inStock) {
          storeTotals[store].total += data.price;
          storeTotals[store].available += 1;
        }
      });
    }
  });
  
  return Object.entries(storeTotals)
    .map(([store, data]) => ({
      store,
      total: data.total,
      coverage: data.available / products.length
    }))
    .sort((a, b) => a.total - b.total);
};
