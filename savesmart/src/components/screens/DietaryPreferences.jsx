import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';

function DietaryPreferences({ onSubmit }) {
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [],
    otherDietaryRestrictions: '',
    allergens: [],
    otherAllergens: '',
  });

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'halal', label: 'Halal' },
    { id: 'kosher', label: 'Kosher' },
    { id: 'dairy-free', label: 'Dairy-Free' },
  ];

  const allergenOptions = [
    { id: 'peanuts', label: 'Peanuts' },
    { id: 'tree-nuts', label: 'Tree Nuts' },
    { id: 'milk', label: 'Milk' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'fish', label: 'Fish' },
    { id: 'shellfish', label: 'Shellfish' },
    { id: 'soy', label: 'Soy' },
    { id: 'wheat', label: 'Wheat' },
  ];

  const handleDietaryChange = (id) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(id)
        ? prev.dietaryRestrictions.filter(item => item !== id)
        : [...prev.dietaryRestrictions, id],
    }));
  };

  const handleAllergenChange = (id) => {
    setPreferences(prev => ({
      ...prev,
      allergens: prev.allergens.includes(id)
        ? prev.allergens.filter(item => item !== id)
        : [...prev.allergens, id],
    }));
  };

  const handleOtherDietaryChange = (e) => {
    setPreferences(prev => ({
      ...prev,
      otherDietaryRestrictions: e.target.value,
    }));
  };

  const handleOtherAllergenChange = (e) => {
    setPreferences(prev => ({
      ...prev,
      otherAllergens: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Dietary Preferences:', preferences);
    onSubmit(preferences);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Dietary Preferences</CardTitle>
          <CardDescription>
            Select your dietary restrictions and allergens
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Dietary Restrictions</h3>
              <div className="grid grid-cols-2 gap-4">
                {dietaryOptions.map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dietary-${id}`}
                      checked={preferences.dietaryRestrictions.includes(id)}
                      onCheckedChange={() => handleDietaryChange(id)}
                    />
                    <label
                      htmlFor={`dietary-${id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label htmlFor="other-dietary" className="text-sm font-medium mb-2 block">
                  Other Dietary Restrictions
                </label>
                <Input
                  id="other-dietary"
                  placeholder="Enter any other dietary restrictions..."
                  value={preferences.otherDietaryRestrictions}
                  onChange={handleOtherDietaryChange}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Allergens</h3>
              <div className="grid grid-cols-2 gap-4">
                {allergenOptions.map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergen-${id}`}
                      checked={preferences.allergens.includes(id)}
                      onCheckedChange={() => handleAllergenChange(id)}
                    />
                    <label
                      htmlFor={`allergen-${id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label htmlFor="other-allergens" className="text-sm font-medium mb-2 block">
                  Other Allergens
                </label>
                <Input
                  id="other-allergens"
                  placeholder="Enter any other allergens..."
                  value={preferences.otherAllergens}
                  onChange={handleOtherAllergenChange}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Next</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default DietaryPreferences;
