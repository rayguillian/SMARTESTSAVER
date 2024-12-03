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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MEALS_COUNT = 4;

const parseMealSuggestions = (suggestions) => {
  // If it's already an array of objects with required fields, return it
  if (Array.isArray(suggestions) && suggestions.length > 0 && 
      suggestions.every(meal => 
        meal && 
        typeof meal === 'object' && 
        typeof meal.name === 'string' &&
        typeof meal.description === 'string' &&
        Array.isArray(meal.ingredients)
      )) {
    return suggestions;
  }

  // If it's a string, try to parse it
  if (typeof suggestions === 'string') {
    try {
      const parsed = JSON.parse(suggestions);
      if (Array.isArray(parsed)) {
        // Validate the structure of each meal object
        const validMeals = parsed.filter(meal => 
          meal && 
          typeof meal === 'object' && 
          typeof meal.name === 'string' &&
          typeof meal.description === 'string' &&
          Array.isArray(meal.ingredients)
        );
        
        if (validMeals.length > 0) return validMeals;
        console.error('No valid meals found in response');
      }
    } catch (e) {
      console.error('Failed to parse meal suggestions:', e, '\nReceived:', suggestions);
    }
  }

  return null; // Return null instead of empty array to indicate parsing failure
};

const MealSelection = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setError(null);

      const suggestions = await mealService.getMealSuggestions(preferences, MEALS_COUNT);
      
      const parsedMeals = parseMealSuggestions(suggestions);
      
      // Only update meals if we successfully parsed the suggestions
      if (parsedMeals) {
        setMeals(parsedMeals);
        unifiedCacheService.setLocalCache('mealSuggestions', parsedMeals);
      } else if (meals.length === 0) {
        // Only set error if we don't have any existing meals
        throw new Error('Failed to get valid meal suggestions');
      }
    } catch (error) {
      console.error('Error loading meal suggestions:', error);
      setError('Failed to load meal suggestions. Please try again.');
      // Keep existing meals if we have them
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const suggestions = await mealService.getMealSuggestions({
        ...preferences,
        forceFresh: true
      }, MEALS_COUNT);
      
      const parsedMeals = parseMealSuggestions(suggestions);
      
      // Only update meals if we successfully parsed the suggestions
      if (parsedMeals) {
        setMeals(parsedMeals);
        unifiedCacheService.setLocalCache('mealSuggestions', parsedMeals);
      } else {
        throw new Error('Failed to get valid meal suggestions');
      }
    } catch (error) {
      console.error('Error refreshing meals:', error);
      setError('Failed to refresh meals. Please try again.');
      // Keep existing meals on refresh error
    } finally {
      setLoading(false);
    }
  };

  const handleMealSelect = async (selectedMeal) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  if (loading && meals.length === 0) {
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
            disabled={loading}
          >
            {loading ? <Spinner className="w-4 h-4" /> : 'New Suggestions'}
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
