export const DANISH_SUPERMARKET_CHAINS = {
  // Discount Supermarkets
  'netto': {
    name: 'Netto',
    color: '#FFCC00',
    textColor: '#000000',
    priceLevel: 'low',
    category: 'discount'
  },
  'rema 1000': {
    name: 'Rema 1000',
    color: '#E30613',
    textColor: '#FFFFFF',
    priceLevel: 'low',
    category: 'discount'
  },
  'lidl': {
    name: 'Lidl',
    color: '#0050AA',
    textColor: '#FFFFFF',
    priceLevel: 'low',
    category: 'discount'
  },
  'aldi': {
    name: 'Aldi',
    color: '#00447C',
    textColor: '#FFFFFF',
    priceLevel: 'low',
    category: 'discount'
  },
  'fakta': {
    name: 'Fakta',
    color: '#E30613',
    textColor: '#FFFFFF',
    priceLevel: 'low',
    category: 'discount'
  },

  // Premium Supermarkets
  'irma': {
    name: 'Irma',
    color: '#000000',
    textColor: '#FFFFFF',
    priceLevel: 'high',
    category: 'premium'
  },
  'meny': {
    name: 'Meny',
    color: '#E4032E',
    textColor: '#FFFFFF',
    priceLevel: 'high',
    category: 'premium'
  },

  // Regular Supermarkets
  'føtex': {
    name: 'Føtex',
    color: '#001B8D',
    textColor: '#FFFFFF',
    priceLevel: 'medium',
    category: 'regular'
  },
  'superbrugsen': {
    name: 'SuperBrugsen',
    color: '#003D7D',
    textColor: '#FFFFFF',
    priceLevel: 'medium',
    category: 'regular'
  },
  'kvickly': {
    name: 'Kvickly',
    color: '#E30613',
    textColor: '#FFFFFF',
    priceLevel: 'medium',
    category: 'regular'
  },

  // Hypermarkets
  'bilka': {
    name: 'Bilka',
    color: '#0066B3',
    textColor: '#FFFFFF',
    priceLevel: 'low',
    category: 'hypermarket'
  },

  // Default for unknown stores
  'default': {
    name: 'Other',
    color: '#808080',
    textColor: '#FFFFFF',
    priceLevel: 'unknown',
    category: 'other'
  }
};

export const identifyStoreChain = (storeName) => {
  const normalizedName = storeName.toLowerCase();
  
  // Try to match the store name with known chains
  for (const [chainId, chainInfo] of Object.entries(DANISH_SUPERMARKET_CHAINS)) {
    if (normalizedName.includes(chainId)) {
      return {
        chainId,
        ...chainInfo
      };
    }
  }

  // Return default styling for unknown stores
  return {
    chainId: 'default',
    ...DANISH_SUPERMARKET_CHAINS.default
  };
};
