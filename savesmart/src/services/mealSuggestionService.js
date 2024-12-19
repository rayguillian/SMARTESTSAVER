import { getEndpointUrl } from '../config/api';
import { unifiedCacheService } from './unifiedCacheService';
import { openaiService } from './openai';
import { requestQueue } from './requestQueue';

const DEFAULT_MEALS = [
  {
    name: "Vegetarian Curry",
    description: "A flavorful Indian curry with mixed vegetables",
    ingredients: ["chickpeas", "mixed vegetables", "curry powder", "coconut milk", "rice"],
    cookingTime: 30,
    estimatedCost: 12,
    cuisineType: "Indian",
    dietaryInfo: ["vegetarian", "vegan-optional"]
  },
  {
    name: "Stir-Fried Noodles",
    description: "Classic Chinese stir-fried noodles with vegetables",
    ingredients: ["noodles", "mixed vegetables", "soy sauce", "ginger", "garlic"],
    cookingTime: 20,
    estimatedCost: 10,
    cuisineType: "Chinese",
    dietaryInfo: ["vegetarian-optional"]
  },
  {
    name: "Mediterranean Pasta",
    description: "Fresh pasta with tomatoes, olives, and herbs",
    ingredients: ["pasta", "cherry tomatoes", "olives", "basil", "olive oil"],
    cookingTime: 25,
    estimatedCost: 15,
    cuisineType: "Italian",
    dietaryInfo: ["vegetarian"]
  },
  {
    name: "Mexican Rice Bowl",
    description: "Spiced rice with beans, corn, and fresh toppings",
    ingredients: ["rice", "black beans", "corn", "tomatoes", "cilantro"],
    cookingTime: 30,
    estimatedCost: 8,
    cuisineType: "Mexican",
    dietaryInfo: ["vegetarian", "vegan"]
  }
];

class MealSuggestionService {
  constructor() {
    this.requestQueue = requestQueue;
  }

  async getMealSuggestions(preferences, forceRefresh = false) {
    const cacheKey = this.generateCacheKey(preferences);

    if (!forceRefresh) {
      const cachedSuggestions = await unifiedCacheService.get('meal_suggestions', cacheKey);
      if (cachedSuggestions) {
        console.log('Serving meal suggestions from cache');
        return cachedSuggestions;
      }
    }

    console.log('Making fresh API call for meal suggestions');
    try {
      const freshSuggestions = await openaiService.getMealSuggestions(preferences);
      if (!freshSuggestions || freshSuggestions.length === 0) {
        console.warn('API returned no suggestions, defaulting to predefined meals');
        return DEFAULT_MEALS;
      }

      await unifiedCacheService.set('meal_suggestions', cacheKey, freshSuggestions);
      return freshSuggestions;
    } catch (error) {
      console.error('Error during API call:', error);
      return DEFAULT_MEALS;
    }
  }

  async fetchMealSuggestions(preferences) {
    try {
      const response = await openaiService.getMealSuggestions(preferences);
      const meals = this.parseMealSuggestions(response);
      
      if (!meals || meals.length === 0) {
        throw new Error('No valid meals returned from API');
      }
      
      return meals;
    } catch (error) {
      console.error('Error fetching meal suggestions:', error);
      throw error;
    }
  }

  generateCacheKey(preferences) {
    // Create a stable cache key from preferences
    const normalized = {
      dietary: [...(preferences.dietary || [])].sort(),
      cuisine: [...(preferences.cuisine || [])].sort(),
      time: preferences.time || 'any',
      cost: preferences.cost || 'any',
      ingredients: [...(preferences.ingredients || [])].sort()
    };
    return JSON.stringify(normalized);
  }

  parseMealSuggestions(suggestions) {
    try {
      // If it's already an array of objects with the right structure
      if (Array.isArray(suggestions)) {
        const validMeals = suggestions.filter(meal => {
          try {
            return this.validateMealStructure(meal);
          } catch (error) {
            console.warn('Invalid meal structure:', error);
            return false;
          }
        });
        if (validMeals.length > 0) {
          return validMeals;
        }
      }

      // If it's a string, try to parse it
      if (typeof suggestions === 'string') {
        try {
          const parsed = JSON.parse(suggestions);
          if (Array.isArray(parsed)) {
            const validMeals = parsed.filter(meal => {
              try {
                return this.validateMealStructure(meal);
              } catch (error) {
                console.warn('Invalid parsed meal structure:', error);
                return false;
              }
            });
            if (validMeals.length > 0) {
              return validMeals;
            }
          }
        } catch (e) {
          console.warn('Failed to parse as JSON, trying text format parsing');
        }

        // Try parsing as text format
        try {
          return this.parseTextFormat(suggestions);
        } catch (error) {
          console.warn('Failed to parse text format:', error);
        }
      }

      console.error('Invalid meal suggestions format:', typeof suggestions);
      return [];
    } catch (error) {
      console.error('Error parsing meal suggestions:', error);
      return [];
    }
  }

  validateMealStructure(meal) {
    if (!meal || typeof meal !== 'object') return false;

    try {
      // Required fields
      if (!meal.name || typeof meal.name !== 'string') return false;
      if (!meal.description || typeof meal.description !== 'string') return false;

      // Handle ingredients in various formats
      if (!meal.ingredients) return false;
      if (typeof meal.ingredients === 'string') {
        meal.ingredients = meal.ingredients.split(',').map(i => i.trim());
      }
      if (!Array.isArray(meal.ingredients)) return false;

      // Optional fields with defaults
      meal.cookingTime = this.parseTime(meal.cookingTime || meal.preparationTime || '30');
      meal.estimatedCost = this.parseCost(meal.estimatedCost || meal.cost || '15');
      meal.cuisineType = meal.cuisineType || 'International';
      meal.dietaryInfo = Array.isArray(meal.dietaryInfo) ? meal.dietaryInfo : [];

      return true;
    } catch (error) {
      console.error('Error validating meal structure:', error);
      return false;
    }
  }

  parseTime(time) {
    if (typeof time === 'number') return time;
    if (typeof time !== 'string') return 30;

    const minutes = parseInt(time.match(/\d+/)?.[0] || '30');
    return isNaN(minutes) ? 30 : minutes;
  }

  parseCost(cost) {
    if (typeof cost === 'number') return cost;
    if (typeof cost !== 'string') return 15;

    const amount = parseFloat(cost.match(/\d+(\.\d+)?/)?.[0] || '15');
    return isNaN(amount) ? 15 : amount;
  }

  parseTextFormat(text) {
    const meals = [];
    const mealSections = text.split(/(?=Name:|Meal \d+:)/).filter(Boolean);

    for (const section of mealSections) {
      try {
        const meal = {
          name: this.extractField(section, 'Name:'),
          description: this.extractField(section, 'Description:'),
          ingredients: this.extractIngredients(section),
          cookingTime: this.parseTime(this.extractField(section, 'Cooking time:|Preparation time:|Time:')),
          estimatedCost: this.parseCost(this.extractField(section, 'Cost:|Estimated cost:|Price:')),
          cuisineType: this.extractField(section, 'Cuisine:|Cuisine type:|Type:') || 'International',
          dietaryInfo: this.extractDietaryInfo(section)
        };

        if (this.validateMealStructure(meal)) {
          meals.push(meal);
        }
      } catch (error) {
        console.warn('Error parsing meal section:', error);
      }
    }

    return meals;
  }

  extractField(text, patterns) {
    const patternList = patterns.split('|');
    for (const pattern of patternList) {
      const match = text.match(new RegExp(`${pattern}\\s*([^\\n]+)`));
      if (match) return match[1].trim();
    }
    return '';
  }

  extractIngredients(text) {
    const ingredients = [];
    const section = text.match(/Ingredients?:([^]*?)(?=\n\s*[A-Z]|$)/i);
    
    if (section) {
      section[1].split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('Ingredients:')) {
          ingredients.push(trimmed.replace(/^[-•*]\s*/, ''));
        }
      });
    }
    return ingredients;
  }

  extractDietaryInfo(text) {
    const dietaryInfo = [];
    const section = text.match(/Dietary info:|Dietary:|Diet:([^]*?)(?=\n\s*[A-Z]|$)/i);
    
    if (section) {
      section[1].split(/[,\n]/).forEach(item => {
        const trimmed = item.trim();
        if (trimmed) {
          dietaryInfo.push(trimmed.replace(/^[-•*]\s*/, ''));
        }
      });
    }
    return dietaryInfo;
  }
}

export const mealSuggestionService = new MealSuggestionService();
