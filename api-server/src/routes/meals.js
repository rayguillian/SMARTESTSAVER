const express = require('express');
const router = express.Router();
const openai = require('../services/openai');
const cache = require('../middleware/cache');
const config = require('../config');

const fallbackMeals = {
  breakfast: [
    { name: "Oatmeal with Fruits", ingredients: ["oats", "milk", "banana", "honey"], estimatedCost: 2.5 },
    { name: "Yogurt Parfait", ingredients: ["yogurt", "granola", "berries"], estimatedCost: 3.0 }
  ],
  lunch: [
    { name: "Chicken Salad Sandwich", ingredients: ["bread", "chicken", "lettuce", "mayo"], estimatedCost: 4.0 },
    { name: "Vegetable Soup", ingredients: ["vegetables", "broth", "herbs"], estimatedCost: 3.5 }
  ],
  dinner: [
    { name: "Pasta with Tomato Sauce", ingredients: ["pasta", "tomato sauce", "cheese"], estimatedCost: 3.0 },
    { name: "Rice and Beans", ingredients: ["rice", "beans", "vegetables"], estimatedCost: 2.5 }
  ]
};

router.post('/suggest', cache(config.cache.meals), async (req, res, next) => {
  try {
    const completion = await openai.chatCompletion([
      { role: "system", content: "You are a helpful meal planning assistant." },
      { role: "user", content: JSON.stringify(req.body) }
    ]);

    res.json(completion.choices[0].message.content);
  } catch (error) {
    if (error.message.includes('rate limit')) {
      return res.json({
        message: "Using cached meal suggestions due to temporary API limitations",
        meals: fallbackMeals
      });
    }
    next(error);
  }
});

module.exports = router;