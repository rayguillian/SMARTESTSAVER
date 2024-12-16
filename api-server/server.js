require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const app = express();
const port = 3000;

// Mock data for stores
const mockStores = {
  'Copenhagen': [
    { name: 'Netto', location: { lat: 55.6761, lng: 12.5683 }, address: 'Nørrebrogade 155' },
    { name: 'Føtex', location: { lat: 55.6785, lng: 12.5715 }, address: 'Frederiksborggade 40' },
    { name: 'Rema 1000', location: { lat: 55.6739, lng: 12.5611 }, address: 'Griffenfeldsgade 37' }
  ],
  'Aarhus': [
    { name: 'Bilka', location: { lat: 56.1572, lng: 10.2107 }, address: 'Værkmestergade 25' },
    { name: 'Føtex', location: { lat: 56.1529, lng: 10.2038 }, address: 'Søndergade 43' },
    { name: 'Netto', location: { lat: 56.1545, lng: 10.2102 }, address: 'Store Torv 4' }
  ]
};

// Basic security and parsing
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Get nearby stores
app.get('/api/stores', (req, res) => {
  const { city = 'Copenhagen' } = req.query;
  res.json({
    stores: mockStores[city] || mockStores['Copenhagen'],
    total: mockStores[city]?.length || mockStores['Copenhagen'].length
  });
});

// Get meal suggestions using OpenAI
app.post('/api/meals/suggest', async (req, res) => {
  const { budget, preferences } = req.body;
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Suggest 3 meals (breakfast, lunch, dinner) for a daily budget of ${budget} DKK. 
Preferences: ${preferences || 'none'}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful meal planning assistant. Respond in JSON format with meals, ingredients, and estimated costs in DKK." },
        { role: "user", content: prompt }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" }
    });

    res.json(completion.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Return mock data if API fails
    res.json({
      meals: {
        breakfast: { name: "Oatmeal with Fruits", ingredients: ["oats", "milk", "banana"], cost: 15 },
        lunch: { name: "Sandwich", ingredients: ["bread", "cheese", "vegetables"], cost: 25 },
        dinner: { name: "Pasta", ingredients: ["pasta", "tomato sauce", "vegetables"], cost: 30 }
      },
      totalCost: 70
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
