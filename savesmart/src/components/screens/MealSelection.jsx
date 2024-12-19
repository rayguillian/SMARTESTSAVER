import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { cn } from "../../lib/utils";

const MealSelection = ({ onSelect, preferences, mealSuggestions }) => {
  const [meals, setMeals] = useState(mealSuggestions || []);
  const [isLoading, setIsLoading] = useState(!mealSuggestions);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // If we have meal suggestions from props, use those
    if (mealSuggestions) {
      setMeals(mealSuggestions);
      setIsLoading(false);
      return;
    }
  }, [user, mealSuggestions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dietary-preferences')}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Select Your Meal</CardTitle>
          <CardDescription>
            Choose from these personalized meal suggestions based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {meals.map((meal, index) => (
              <Card 
                key={index}
                className={cn(
                  "cursor-pointer hover:bg-gray-50 transition-colors",
                  "border border-gray-200 rounded-lg p-4"
                )}
                onClick={() => onSelect(meal)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{meal.name}</CardTitle>
                  <CardDescription>{meal.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Preparation Time: {meal.preparationTime}
                    </p>
                    <p className="text-sm text-gray-500">
                      Difficulty: {meal.difficulty}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Ingredients:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {meal.ingredients.map((ingredient, idx) => (
                          <li key={idx}>{ingredient}</li>
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