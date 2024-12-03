import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';

function CuisinePreferences({ onSubmit }) {
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [complexity, setComplexity] = useState(3);
  const [maxCookingTime, setMaxCookingTime] = useState(60);

  const cuisineOptions = [
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Indian',
    'Thai',
    'Mediterranean',
    'American',
    'French',
    'Korean',
    'Vietnamese',
    'Middle Eastern',
  ];

  const toggleCuisine = (cuisine) => {
    setSelectedCuisines(
      selectedCuisines.includes(cuisine)
        ? selectedCuisines.filter((c) => c !== cuisine)
        : [...selectedCuisines, cuisine]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Cuisine Preferences:', {
      cuisines: selectedCuisines,
      complexity: { level: complexity },
      maxCookingTime: { minutes: maxCookingTime },
    });
    onSubmit({
      cuisines: selectedCuisines,
      complexity: { level: complexity },
      maxCookingTime: { minutes: maxCookingTime },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Cuisine Preferences</CardTitle>
          <CardDescription>
            Select your preferred cuisines and cooking preferences
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Preferred Cuisines</h3>
              <div className="grid grid-cols-2 gap-4">
                {cuisineOptions.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={cuisine}
                      checked={selectedCuisines.includes(cuisine)}
                      onCheckedChange={() => toggleCuisine(cuisine)}
                    />
                    <label
                      htmlFor={cuisine}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {cuisine}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Recipe Complexity Level: {complexity}
                </label>
                <Slider
                  value={[complexity]}
                  onValueChange={([value]) => setComplexity(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  {complexity === 1 ? 'Very Easy' : 
                   complexity === 2 ? 'Easy' :
                   complexity === 3 ? 'Moderate' :
                   complexity === 4 ? 'Advanced' : 'Expert'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Maximum Cooking Time: {maxCookingTime} minutes
                </label>
                <Slider
                  value={[maxCookingTime]}
                  onValueChange={([value]) => setMaxCookingTime(value)}
                  min={15}
                  max={180}
                  step={15}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Continue</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default CuisinePreferences;
