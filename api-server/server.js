// Load environment variables from api-server's own .env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const app = express();
const port = process.env.PORT || 3002;

// Use only backend's OPENAI_API_KEY
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
 console.error('===== CRITICAL ERROR =====');
 console.error('OPENAI API KEY IS NOT SET!');
 console.error('Please set OPENAI_API_KEY in api-server/.env file');
 console.error('You can get an API key at: https://platform.openai.com/account/api-keys');
 console.error('Exiting application...');
 process.exit(1);
}

const openai = new OpenAI({
 apiKey: openaiApiKey
});

// Security headers with relaxed COOP and COEP
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Configure CORS before other middleware
app.use(cors({
 origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000', 'http://localhost:5001'],
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization'],
 credentials: true
}));

// Enable pre-flight requests for all routes
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());

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
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

// Utility functions
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

function calculateDistance(lat1, lon1, lat2, lon2) {
 const R = 6371; // Radius of the earth in km
 const dLat = deg2rad(lat2 - lat1);
 const dLon = deg2rad(lon2 - lon1);
 const a = 
   Math.sin(dLat/2) * Math.sin(dLat/2) +
   Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
   Math.sin(dLon/2) * Math.sin(dLon/2)
 ; 
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
 const distance = R * c; // Distance in km
 return distance;
}

function deg2rad(deg) {
 return deg * (Math.PI/180);
}

// Pre-generated meal suggestions for common preferences
const DEFAULT_MEALS = {};

// Meal suggestion endpoint
app.post('/api/meals/suggest', async (req, res) => {
 try {
   const { preferences } = req.body;
   
   if (!preferences || !preferences.dietary || !preferences.cuisine) {
     return res.status(400).json({
       error: 'Invalid request',
       message: 'Both dietary and cuisine preferences are required'
     });
   }

   console.log('Making OpenAI API request for meal suggestions with preferences:', JSON.stringify(preferences, null, 2));
   
   // Format the system message
   const systemMessage = `You are a meal planning assistant specializing in authentic cuisine adaptations that comply with dietary restrictions.
   You must strictly follow these rules:
   1. Every dish MUST be an authentic ${preferences.cuisine.cuisineTypes.join(' or ')} recipe adapted for dietary restrictions
   2. DO NOT suggest dishes from other cuisines
   3. Maintain traditional cooking methods and flavors while ensuring dietary compliance
   4. Use authentic ingredients that meet dietary restrictions`;

   const userMessage = `Please suggest a meal that meets these requirements:

   Primary Cuisine: ${preferences.cuisine.cuisineTypes.join(', ')}
   Dietary Restrictions: ${preferences.dietary.restrictions.join(', ')}
   Allergens to Avoid: ${preferences.dietary.allergens.join(', ') || 'None'}
   Maximum Preparation Time: ${preferences.cuisine.maxPrepTime}
   Difficulty Level: ${preferences.cuisine.difficulty}

   The response MUST be a valid JSON object with a single meal in this format:
   {
     "name": "Dish Name",
     "description": "Detailed description",
     "ingredients": ["ingredient 1", "ingredient 2"],
     "preparationTime": "XX minutes",
     "difficulty": "easy/medium/hard"
   }`;

   // Call OpenAI API
   const completion = await openai.chat.completions.create({
     model: "gpt-3.5-turbo-1106",
     response_format: { type: "json_object" },
     messages: [
       { role: "system", content: systemMessage },
       { role: "user", content: userMessage }
     ],
     temperature: 0.7,
     max_tokens: 1000
   });

   if (!completion?.choices?.[0]?.message?.content) {
     throw new Error('Invalid response from OpenAI');
   }

   console.log('Raw OpenAI response:', completion.choices[0].message.content);

   // Parse the response
   const response = JSON.parse(completion.choices[0].message.content);
   
   // Handle both single meal and meals array responses
   let meals = [];
   if (response.meals && Array.isArray(response.meals)) {
     meals = response.meals;
   } else if (response.name) {
     // Single meal response
     meals = [response];
   } else {
     console.error('Invalid meal format in response:', response);
     throw new Error('Invalid meal format in OpenAI response');
   }

   // Validate each meal has required fields
   const validMeals = meals.every(meal => 
     meal.name && 
     meal.description && 
     Array.isArray(meal.ingredients) && 
     meal.preparationTime && 
     meal.difficulty
   );

   if (!validMeals) {
     console.error('Missing required fields in meals:', meals);
     throw new Error('Invalid meal data structure');
   }

   return res.json({ meals });
 } catch (error) {
   console.error('Error generating meal suggestions:', error);
   res.status(500).json({ 
     error: 'Failed to generate meal suggestions',
     message: error.message 
   });
 }
});

// OpenAI Chat Route
app.post('/api/openai/chat', async (req, res) => {
  console.log('===== OPENAI CHAT ROUTE DEBUG =====');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  try {
    const { preferences } = req.body;

    if (!preferences || !preferences.dietary) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Preferences with dietary restrictions are required'
      });
    }

    // Format the system message
    const systemMessage = `You are a meal planning assistant specializing in authentic cuisine adaptations that comply with dietary restrictions.
    You must strictly follow these rules:
    1. Always respond with exactly 4 meal suggestions in JSON format
    2. MOST IMPORTANT: Each meal must be primarily of the requested cuisine type (e.g., if Chinese is requested, every meal must be a Chinese dish)
    3. Adapt the requested cuisine's traditional dishes to meet dietary restrictions
    4. Never suggest dishes from other cuisines, even if they meet the dietary restrictions
    5. Focus on authentic ingredients and cooking methods of the requested cuisine, modified only as needed for dietary compliance

    For example, if Chinese cuisine and Kosher dietary restriction are selected:
    - DO: Adapt Kung Pao Chicken using kosher chicken and kosher-certified sauces
    - DO: Create Ma Po Tofu using kosher ingredients
    - DON'T: Suggest non-Chinese dishes like Shakshuka or Kugel
    - DON'T: Completely change the dish's character to meet restrictions

    Each meal must include:
    - name: Name that reflects the specific cuisine (e.g., "Kosher Kung Pao Chicken" for Chinese)
    - description: Explain how this authentic dish was adapted for dietary needs
    - ingredients: List of compliant ingredients that maintain authenticity
    - preparationTime: Estimated time
    - difficulty: easy/medium/hard`;

    // Format the user message with preferences
    const userMessage = `Generate 4 ${preferences.cuisine.cuisineTypes ? preferences.cuisine.cuisineTypes.join(' and ') : ''} meals that are fully compliant with these requirements:
    
Primary Cuisine: ${preferences.cuisine.cuisineTypes ? preferences.cuisine.cuisineTypes.join(', ') : 'Any'} (MUST be the foundation of every dish)
Dietary Restrictions: ${preferences.dietary.restrictions.join(', ')}
Allergens to Avoid: ${preferences.dietary.allergens.join(', ')}
Maximum Preparation Time: ${preferences.cuisine.maxPrepTime || '60 minutes'}
Difficulty Level: ${preferences.cuisine.difficulty || 'medium'}

IMPORTANT REQUIREMENTS:
1. Every dish MUST be an authentic ${preferences.cuisine.cuisineTypes ? preferences.cuisine.cuisineTypes.join(' or ') : ''} recipe adapted for dietary restrictions
2. DO NOT suggest dishes from other cuisines
3. Maintain traditional cooking methods and flavors while ensuring dietary compliance
4. Use authentic ingredients that meet dietary restrictions

For example, for Chinese Kosher meals:
✓ DO: "Kosher Chinese Orange Chicken" (using kosher chicken and kosher-certified Asian sauces)
✓ DO: "Chinese Kosher Beef and Broccoli" (using kosher beef and traditional Chinese cooking methods)
✗ DON'T: Traditional Jewish or other cuisine dishes
✗ DON'T: Generic dishes that aren't clearly from the requested cuisine

Response format:
{
  "name": "Cuisine-Specific Compliant Name",
  "description": "How this authentic dish was adapted",
  "ingredients": ["authentic ingredient 1 (compliant)", "authentic ingredient 2 (compliant)"],
  "preparationTime": "XX minutes",
  "difficulty": "easy/medium/hard"
}`;

    // Make a direct chat completion call
    try {
      console.log('Sending to OpenAI:', { systemMessage, userMessage });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      if (!completion?.choices?.[0]?.message?.content) {
        console.error('Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }

      console.log('Raw OpenAI response:', completion.choices[0].message.content);

      // Parse the response
      const response = JSON.parse(completion.choices[0].message.content);
      
      // Handle both single meal and meals array responses
      let meals = [];
      if (response.meals && Array.isArray(response.meals)) {
        meals = response.meals;
      } else if (response.name) {
        // Single meal response
        meals = [response];
      } else {
        console.error('Invalid meal format in response:', response);
        throw new Error('Invalid meal format in OpenAI response');
      }

      // Validate each meal has required fields
      const validMeals = meals.every(meal => 
        meal.name && 
        meal.description && 
        Array.isArray(meal.ingredients) && 
        meal.preparationTime && 
        meal.difficulty
      );

      if (!validMeals) {
        console.error('Missing required fields in meals:', meals);
        throw new Error('Invalid meal data structure');
      }

      return res.json({ meals });
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Check if it's an API key error
      if (error.code === 'invalid_api_key' || error.message?.includes('API key')) {
        return res.status(500).json({
          error: 'OpenAI API key configuration error',
          message: 'Please check your OpenAI API key configuration'
        });
      }
      
      // Check if it's a rate limit error
      if (error.code === 'rate_limit_exceeded') {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.'
        });
      }

      // For parsing errors or invalid responses, return a specific error
      if (error.message?.includes('JSON')) {
        return res.status(500).json({
          error: 'Invalid response format',
          message: 'Failed to parse OpenAI response'
        });
      }

      // For other errors, return a generic error
      return res.status(500).json({
        error: 'Failed to generate meal suggestions',
        message: error.message || 'Unknown error occurred'
      });
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({
      error: 'Failed to generate meal suggestions',
      meals: []
    });
  }
});

// OpenAI health check endpoint
app.get('/api/openai/health', async (req, res) => {
 try {
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

   if (!completion?.choices?.[0]?.message?.content) {
     throw new Error('Invalid response from OpenAI');
   }

   res.json({
     status: 'healthy',
     message: 'OpenAI API is responding correctly',
     apiTest: completion.choices[0].message.content
   });

 } catch (error) {
   console.error('OpenAI Health Check Error:', error);
   res.status(error.status || 500).json({
     status: 'error',
     message: error.message || 'Failed to connect to OpenAI API',
     error: error.response?.data || error.message
   });
 }
});

// Endpoints
app.get('/api/nearbyStores', async (req, res) => {
 try {
   const { userLocation, travelPreferences } = req.query;
   if (!userLocation) {
     return res.status(400).json({ error: 'User location is required' });
   }

   const parsedLocation = JSON.parse(userLocation);
   const nearestCity = findNearestCity(parsedLocation);

   const response = await axios.get(
     'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
     {
       params: {
         location: `${parsedLocation.latitude},${parsedLocation.longitude}`,
         radius: (travelPreferences && JSON.parse(travelPreferences).radius) || 5000,
         type: 'grocery_or_supermarket',
         language: 'da',
         key: process.env.GOOGLE_MAPS_API_KEY
       }
     }
   );

   if (!response.data.results || response.data.results.length === 0) {
     return res.json({
       stores: fallbackStores[nearestCity],
       total: fallbackStores[nearestCity].length,
       fallback: true
     });
   }

   const filteredResults = response.data.results.filter(store => 
     danishSupermarkets.some(chain => 
       store.name.toLowerCase().includes(chain.name.toLowerCase())
     )
   );

   if (filteredResults.length === 0) {
     return res.json({
       stores: fallbackStores[nearestCity],
       total: fallbackStores[nearestCity].length,
       fallback: true
     });
   }

   res.json({
     stores: filteredResults,
     total: filteredResults.length,
     fallback: false
   });
 } catch (error) {
   console.error('Error finding nearby stores:', error);
   res.status(500).json({ error: 'Failed to find nearby stores' });
 }
});

// Start the server
const server = app.listen(port, () => {
 console.log(`SmartestSaver API Server running on http://localhost:${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please free up the port and try again.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});