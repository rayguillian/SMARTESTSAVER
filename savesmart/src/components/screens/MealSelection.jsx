import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { cn } from "../../lib/utils";
import { mealService } from "../../services/mealService";
import { apiClient } from '../../config/api';
import { unifiedCacheService } from '../../services/unifiedCacheService';
import { openaiService } from '../../services/openaiService';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MEALS_COUNT = 4;

const DEFAULT_MEALS = [
  {
    name: 'Default Meal 1',
    description: 'This is a default meal',
    ingredients: ['Ingredient 1', 'Ingredient 2'],
    preparationTime: 30,
    estimatedCost: 15
  },
  {
    name: 'Default Meal 2',
    description: 'This is another default meal',
    ingredients: ['Ingredient 3', 'Ingredient 4'],
    preparationTime: 30,
    estimatedCost: 15
  },
  {
    name: 'Default Meal 3',
    description: 'This is yet another default meal',
    ingredients: ['Ingredient 5', 'Ingredient 6'],
    preparationTime: 30,
    estimatedCost: 15
  },
  {
    name: 'Default Meal 4',
    description: 'This is the last default meal',
    ingredients: ['Ingredient 7', 'Ingredient 8'],
    preparationTime: 30,
    estimatedCost: 15
  }
];

const parseMealSuggestions = (suggestions) => {
  console.log('Parsing Meal Suggestions:', JSON.stringify(suggestions, null, 2));

  // Direct parsing of OpenAI response
  if (suggestions && suggestions.choices && suggestions.choices.length > 0) {
    try {
      const content = suggestions.choices[0].message.content;
      console.log('Parsing Content:', content);
      
      const parsed = JSON.parse(content);
      console.log('Parsed Meals:', JSON.stringify(parsed, null, 2));
      
      return parsed;
    } catch (error) {
      console.error('Parsing Error:', error);
      return null;
    }
  }

  // Fallback for direct array
  if (Array.isArray(suggestions)) {
    return suggestions;
  }

  console.error('Invalid Suggestions Format');
  return null;
};

const MealSelection = () => {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { preferences, updatePreferences } = useUserPreferences();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only load meals if we don't have any
    if (meals.length === 0) {
      loadMealSuggestions();
    }
  }, []); 

  const loadMealSuggestions = async () => {
    try {
      setIsLoading(true);
      const suggestions = await openaiService.getMealSuggestions(preferences);
      
      console.log('Received meal suggestions:', suggestions);
      
      // Use the new parseMealSuggestions function
      const parsedMeals = parseMealSuggestions(suggestions);
      
      if (parsedMeals && parsedMeals.length > 0) {
        // Prioritize parsed AI-generated meals
        setMeals(parsedMeals);
        unifiedCacheService.setLocalCache('mealSuggestions', parsedMeals);
      } else {
        console.warn('No AI meal suggestions received');
        // If no AI suggestions, use existing meal selection logic
        const defaultMeals = await mealService.getDefaultMeals(preferences);
        setMeals(defaultMeals);
      }
    } catch (error) {
      console.error('Error loading meal suggestions:', error);
      
      // Fallback to default meals from meal service
      const defaultMeals = await mealService.getDefaultMeals(preferences);
      setMeals(defaultMeals);
      
      // Optional: show user-friendly error message
      setError('Unable to load meal suggestions. Using default meals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const suggestions = await openaiService.getMealSuggestions(preferences);
      
      console.log('Received meal suggestions:', suggestions);
      
      // Use the new parseMealSuggestions function
      const parsedMeals = parseMealSuggestions(suggestions);
      
      if (parsedMeals && parsedMeals.length > 0) {
        // Prioritize parsed AI-generated meals
        setMeals(parsedMeals);
        unifiedCacheService.setLocalCache('mealSuggestions', parsedMeals);
      } else {
        console.warn('No AI meal suggestions received');
        // If no AI suggestions, use existing meal selection logic
        const defaultMeals = await mealService.getDefaultMeals(preferences);
        setMeals(defaultMeals);
      }
    } catch (error) {
      console.error('Error refreshing meals:', error);
      
      // Fallback to default meals from meal service
      const defaultMeals = await mealService.getDefaultMeals(preferences);
      setMeals(defaultMeals);
      
      // Optional: show user-friendly error message
      setError('Unable to refresh meals. Using default meals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealSelect = async (selectedMeal) => {
    try {
      setIsLoading(true);
      // Update preferences with selected meal and ingredients
      await updatePreferences({
        ...preferences,
        selectedMeal: selectedMeal,
        ingredients: selectedMeal.ingredients.map(ingredient => ({
          name: typeof ingredient === 'string' ? ingredient : ingredient.name,
          amount: typeof ingredient === 'string' ? '1' : ingredient.amount,
          checked: false
        }))
      });
      // Navigate to shopping list
      navigate('/shopping-list');
    } catch (error) {
      console.error('Error selecting meal:', error);
      setError('Failed to save meal selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && meals.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6 flex justify-center items-center min-h-[400px]">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error && meals.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadMealSuggestions}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Select Your Meal</CardTitle>
            <CardDescription>Choose from these AI-generated suggestions</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? <Spinner className="w-4 h-4" /> : 'New Suggestions'}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meals.map((meal, index) => (
              <Card 
                key={index}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  "border-2 hover:border-primary"
                )}
                onClick={() => handleMealSelect(meal)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{meal.name}</CardTitle>
                  <CardDescription>{meal.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Preparation: {meal.preparationTime || meal.cookingTime || '30'} mins</span>
                      <span>Cost: ${meal.estimatedCost || '15'}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Ingredients:</h4>
                      <ul className="text-sm text-muted-foreground list-disc pl-4">
                        {meal.ingredients.map((ingredient, i) => (
                          <li key={i}>
                            {typeof ingredient === 'string' 
                              ? ingredient 
                              : `${ingredient.name} ${ingredient.amount ? `(${ingredient.amount})` : ''}`
                            }
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MealSelection;
