require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mcache = require('memory-cache');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const app = express();
const port = 3000;

// Security headers
app.use(helmet());

// Configure CORS before other middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Enable pre-flight requests for all routes
app.options('*', cors());

// Compression
app.use(compression({
  level: 6,
  threshold: '50kb'
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Body parser with limits
app.use(express.json({ 
  limit: '1mb',
  strict: true 
}));

// Cache middleware with longer duration
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = mcache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Danish supermarkets list with variations
const danishSupermarkets = [
  { name: 'netto', variations: ['netto', 'døgnnetto'] },
  { name: 'føtex', variations: ['føtex', 'fotex', 'føtex food'] },
  { name: 'bilka', variations: ['bilka'] },
  { name: 'rema 1000', variations: ['rema', 'rema 1000', 'rema1000'] },
  { name: 'lidl', variations: ['lidl'] },
  { name: 'aldi', variations: ['aldi'] },
  { name: 'spar', variations: ['spar', 'eurospar'] },
  { name: 'meny', variations: ['meny'] },
  { name: 'coop', variations: ['coop', '365discount'] },
  { name: 'daglibrugsen', variations: ['dagli\'brugsen', 'daglibrugsen', 'dagli brugsen'] },
  { name: 'superbrugsen', variations: ['superbrugsen', 'super brugsen'] },
  { name: 'kvickly', variations: ['kvickly'] },
  { name: 'fakta', variations: ['fakta'] },
  { name: 'irma', variations: ['irma'] }
];

// Fallback Danish stores by city
const fallbackStores = {
  'Copenhagen': [
    { name: 'Netto', location: { lat: 55.6761, lng: 12.5683 }, vicinity: 'Nørrebrogade 155, Copenhagen' },
    { name: 'Føtex', location: { lat: 55.6785, lng: 12.5715 }, vicinity: 'Frederiksborggade 40, Copenhagen' },
    { name: 'Rema 1000', location: { lat: 55.6739, lng: 12.5611 }, vicinity: 'Griffenfeldsgade 37, Copenhagen' }
  ],
  'Aarhus': [
    { name: 'Bilka', location: { lat: 56.1572, lng: 10.2107 }, vicinity: 'Værkmestergade 25, Aarhus' },
    { name: 'Føtex', location: { lat: 56.1529, lng: 10.2038 }, vicinity: 'Søndergade 43, Aarhus' },
    { name: 'Netto', location: { lat: 56.1545, lng: 10.2102 }, vicinity: 'Store Torv 4, Aarhus' }
  ]
};

// Fallback data for when OpenAI is rate limited
const fallbackMeals = {
  breakfast: [
    { name: "Oatmeal with Fruits", ingredients: ["oats", "milk", "banana", "honey"], estimatedCost: 2.5 },
    { name: "Yogurt Parfait", ingredients: ["yogurt", "granola", "berries"], estimatedCost: 3.0 },
    { name: "Toast with Eggs", ingredients: ["bread", "eggs", "butter"], estimatedCost: 2.0 }
  ],
  lunch: [
    { name: "Chicken Salad Sandwich", ingredients: ["bread", "chicken", "lettuce", "mayo"], estimatedCost: 4.0 },
    { name: "Vegetable Soup", ingredients: ["vegetables", "broth", "herbs"], estimatedCost: 3.5 },
    { name: "Tuna Wrap", ingredients: ["tortilla", "tuna", "vegetables"], estimatedCost: 3.8 }
  ],
  dinner: [
    { name: "Pasta with Tomato Sauce", ingredients: ["pasta", "tomato sauce", "cheese"], estimatedCost: 3.0 },
    { name: "Rice and Beans", ingredients: ["rice", "beans", "vegetables"], estimatedCost: 2.5 },
    { name: "Baked Chicken", ingredients: ["chicken", "potatoes", "vegetables"], estimatedCost: 5.0 }
  ]
};

// Add a test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get('/api/nearbyStores', async (req, res) => {
  try {
    const { userLocation, travelPreferences } = req.query;
    if (!userLocation) {
      return res.status(400).json({
        error: 'Missing user location',
        message: 'Please enable location services or provide a location'
      });
    }

    if (!travelPreferences) {
      return res.status(400).json({
        error: 'Missing travel preferences',
        message: 'Please provide travel preferences including radius'
      });
    }

    const location = JSON.parse(userLocation);
    const preferences = JSON.parse(travelPreferences);

    const cachedStores = mcache.get(`stores_${location.latitude}_${location.longitude}`);
    if (cachedStores) {
      return res.json({ stores: cachedStores });
    }

    let radius = preferences.radius;
    if (!radius) {
      return res.status(400).json({
        error: 'Missing radius',
        message: 'Please provide a search radius in meters'
      });
    }

    console.log('Search parameters:', {
      location: `${location.latitude},${location.longitude}`,
      radius,
      type: 'grocery_or_supermarket'
    });

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius: radius,
          type: 'grocery_or_supermarket',
          language: 'da',
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (!response.data.results || response.data.results.length === 0) {
      const fallbackCity = findNearestCity(location);
      return res.json({
        stores: fallbackStores[fallbackCity],
        total: fallbackStores[fallbackCity].length,
        fallback: true
      });
    }

    const filteredResults = response.data.results.filter(store => 
      danishSupermarkets.some(chain => 
        store.name.toLowerCase().includes(chain.name.toLowerCase())
      )
    );

    if (filteredResults.length === 0) {
      const fallbackCity = findNearestCity(location);
      return res.json({
        stores: fallbackStores[fallbackCity],
        total: fallbackStores[fallbackCity].length,
        fallback: true
      });
    }

    mcache.put(
      `stores_${location.latitude}_${location.longitude}`,
      filteredResults,
      1800000 // 30 minutes cache
    );

    return res.json({
      stores: filteredResults,
      total: filteredResults.length,
      fallback: false
    });

  } catch (error) {
    console.error('Error in /api/nearbyStores:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Rate limit tracking
const rateLimitState = {
  isLimited: false,
  resetTime: null,
  cooldownMs: 3600000 // 1 hour in milliseconds
};

// Rate limit middleware
const checkRateLimit = (req, res, next) => {
  if (rateLimitState.isLimited) {
    const now = Date.now();
    if (now < rateLimitState.resetTime) {
      const waitTimeMinutes = Math.ceil((rateLimitState.resetTime - now) / 60000);
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Please try again in ${waitTimeMinutes} minutes.`,
        resetTime: rateLimitState.resetTime
      });
    } else {
      rateLimitState.isLimited = false;
      rateLimitState.resetTime = null;
    }
  }
  next();
};

// Apply rate limit middleware to OpenAI routes
app.use('/api/openai', checkRateLimit);

// Add proper error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message?.includes('rate limit')) {
    const resetTime = Date.now() + 3600000; // 1 hour
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Rate limit exceeded. Please try again in about an hour.',
      resetTime
    });
  }
  
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// Add missing endpoints
app.get('/api/user/preferences', (req, res) => {
  res.json({ preferences: {} }); // Return empty preferences if none exist
});

app.post('/api/user/preferences', (req, res) => {
  // Store preferences (implement proper storage later)
  res.json({ success: true });
});

// OpenAI chat endpoint
app.post('/api/openai/chat', async (req, res) => {
  try {
    console.log('Received OpenAI chat request:', req.body);
    
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'Messages array is required'
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('OpenAI response received');
    res.json(completion);
  } catch (error) {
    console.error('OpenAI chat error:', error);
    
    if (error.response?.status === 429 || error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600
      });
    }

    res.status(500).json({
      error: 'openai_error',
      message: error.message
    });
  }
});

// OpenAI health check endpoint
app.get('/api/openai/health', async (req, res) => {
  try {
    // Simple test completion to verify API key and connection
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Hi, this is a test message. Please respond with 'OK'."
        }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 5
    });

    // Check if we got a valid response
    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    // Send JSON response
    res.json({
      status: 'healthy',
      message: 'OpenAI API is responding correctly',
      apiTest: completion.choices[0].message.content
    });

  } catch (error) {
    // Log the full error for debugging
    console.error('OpenAI Health Check Error:', error);
    
    // Send JSON error response
    res.status(error.status || 500).json({
      status: 'error',
      message: error.message || 'Failed to connect to OpenAI API',
      error: error.response?.data || error.message
    });
  }
});

// Add meal suggestion endpoint
app.post('/api/meals/suggest', async (req, res) => {
  try {
    const cachedResponse = mcache.get(`meals_${JSON.stringify(req.body)}`);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful meal planning assistant." },
        { role: "user", content: JSON.stringify(req.body) }
      ]
    });

    const suggestions = completion.choices[0].message.content;
    mcache.put(`meals_${JSON.stringify(req.body)}`, suggestions, 7200 * 1000); // 2 hours cache
    res.json(suggestions);

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.message.includes('rate limit')) {
      // Return fallback data when rate limited
      return res.json({
        message: "Using cached meal suggestions due to temporary API limitations",
        meals: fallbackMeals
      });
    }
    
    res.status(500).json({
      error: error.message,
      message: "An error occurred while generating meal suggestions",
      fallback: true,
      meals: fallbackMeals
    });
  }
});

// Increase cache duration for API responses
app.use('/api/nearbyStores', cacheMiddleware(3600)); // 1 hour cache
app.use('/api/meals/suggest', cacheMiddleware(7200)); // 2 hours cache

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Helper function to find nearest city
function findNearestCity(location) {
  const cities = {
    'Copenhagen': { lat: 55.6761, lng: 12.5683 },
    'Aarhus': { lat: 56.1572, lng: 10.2107 }
  };

  let nearestCity = 'Copenhagen'; // Default to Copenhagen
  let shortestDistance = Number.MAX_VALUE;

  for (const [city, coords] of Object.entries(cities)) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      coords.lat,
      coords.lng
    );
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}
