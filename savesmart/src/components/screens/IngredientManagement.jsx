import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';

function IngredientManagement({ meal, onNext }) {
  const [ownedIngredients, setOwnedIngredients] = useState([]);

  const toggleIngredient = (ingredient) => {
    setOwnedIngredients(
      ownedIngredients.includes(ingredient)
        ? ownedIngredients.filter((i) => i !== ingredient)
        : [...ownedIngredients, ingredient]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(ownedIngredients);
  };

  if (!meal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No meal selected. Please go back and select a meal.</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Ingredient Management</CardTitle>
        <CardDescription>
          Select the ingredients you already have for {meal.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {meal.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg border bg-card"
                >
                  <Checkbox
                    id={`ingredient-${index}`}
                    checked={ownedIngredients.includes(ingredient)}
                    onCheckedChange={() => toggleIngredient(ingredient)}
                  />
                  <div className="flex flex-col">
                    <label
                      htmlFor={`ingredient-${index}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {ingredient.name}
                    </label>
                    {ingredient.amount && (
                      <p className="text-sm text-muted-foreground">
                        {ingredient.amount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button onClick={handleSubmit} className="w-full">
          Continue to Shopping List
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          {meal.ingredients.length - ownedIngredients.length} ingredients needed
        </p>
      </CardFooter>
    </Card>
  );
}

export default IngredientManagement;
