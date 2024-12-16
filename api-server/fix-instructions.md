# OpenAI Integration Fix Instructions

1. First, create a new `.env` file in the `api-server` directory with the following content:
```env
# API Keys
OPENAI_API_KEY=your-new-api-key-here
GOOGLE_MAPS_API_KEY=your-google-maps-key-here

# Environment
NODE_ENV=development

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-key-here
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

2. Update your server.js recipe endpoint:
```javascript
app.post('/api/meals/suggest', async (req, res) => {
  try {
    const { preferences, budget, mealType } = req.body;
    
    // Check cache first
    const cacheKey = `meals_${JSON.stringify(req.body)}`;
    const cachedResponse = mcache.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Construct a clear prompt for the recipe
    const prompt = `Please suggest a ${mealType} recipe that fits these preferences: ${JSON.stringify(preferences)}. 
    The budget is ${budget}. Please format the response as a JSON object with the following structure:
    {
      "recipe": {
        "name": "Recipe Name",
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"],
        "estimatedCost": number,
        "cookingTime": "time in minutes"
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful cooking assistant that provides recipes based on preferences and budget constraints. Always respond with valid JSON."
        },
        { 
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const suggestion = completion.choices[0].message.content;
    
    // Validate that we got valid JSON
    const parsedSuggestion = JSON.parse(suggestion);
    
    // Cache the valid response
    mcache.put(cacheKey, parsedSuggestion, 7200 * 1000); // 2 hours cache
    
    res.json(parsedSuggestion);

  } catch (error) {
    console.error('Recipe Suggestion Error:', error);
    
    if (error.message.includes('rate limit')) {
      // Return fallback data when rate limited
      return res.json({
        message: "Using cached meal suggestions due to temporary API limitations",
        recipe: fallbackMeals[req.body.mealType]?.[0] || fallbackMeals.dinner[0]
      });
    }
    
    res.status(500).json({
      error: "Failed to generate recipe",
      message: error.message,
      fallback: true,
      recipe: fallbackMeals[req.body.mealType]?.[0] || fallbackMeals.dinner[0]
    });
  }
});
```

3. At the top of server.js, change:
```javascript
// Remove this line
require('dotenv').config({ path: '../savesmart/.env' });

// Replace with this
require('dotenv').config();

// And update the API key validation
const openaiApiKey = process.env.OPENAI_API_KEY;
// Remove the VITE_OPENAI_API_KEY check
```

4. Important Security Steps:
   - Delete the existing `.env` file from the repository as it contains exposed API keys
   - Generate new API keys for all services (OpenAI, Google Maps, Firebase)
   - Update your local `.env` file with the new keys
   - Make sure `.env` is in your `.gitignore` file

5. Test the changes:
   - Start the server: `node server.js`
   - Make a test request to `/api/meals/suggest` with:
     ```json
     {
       "preferences": {
         "dietary": ["vegetarian"],
         "allergies": []
       },
       "budget": "10",
       "mealType": "dinner"
     }
     ```
   - You should get back a properly formatted recipe
