import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { MapPinIcon } from 'lucide-react';

function TravelPreferences({ onSubmit }) {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(5);
  const [maxStores, setMaxStores] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      location,
      radius,
      maxStores,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinIcon className="h-6 w-6" />
            Travel Preferences
          </CardTitle>
          <CardDescription>
            Set your shopping location and travel preferences
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="location">
                Your Location
              </label>
              <Input
                id="location"
                placeholder="Enter your address or zip code"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Maximum Travel Distance: {radius} miles
              </label>
              <Slider
                value={[radius]}
                onValueChange={([value]) => setRadius(value)}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                We'll find stores within this radius
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Maximum Number of Stores: {maxStores}
              </label>
              <Slider
                value={[maxStores]}
                onValueChange={([value]) => setMaxStores(value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Limit the number of stores in your shopping route
              </p>
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

export default TravelPreferences;
