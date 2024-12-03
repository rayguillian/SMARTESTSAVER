import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { useUserPreferences } from '../../hooks/useUserPreferences';

const Ingredients = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useUserPreferences();
  const ingredients = preferences.ingredients || [];
  const selectedMeal = preferences.selectedMeal;

  console.log('Selected Meal:', selectedMeal);
  console.log('Ingredients:', ingredients);

  const handleContinue = () => {
    navigate('/shopping-list');
  };

  const handleBack = () => {
    navigate('/meal-selection');
  };

  if (!selectedMeal || ingredients.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Ingredients Selected</CardTitle>
            <CardDescription>
              Please select a meal first to view its ingredients.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleBack} className="w-full">
              Back to Meal Selection
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{selectedMeal.name} - Ingredients</CardTitle>
          <CardDescription>
            Review your ingredients before proceeding to the shopping list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-muted-foreground">{ingredient.amount}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleContinue}>
            Continue to Shopping List
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Ingredients;
