import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

function HomePage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const features = [
    {
      title: 'Meal Planning',
      description: 'Plan your meals with smart recommendations based on your preferences',
      action: () => navigate('/meal-selection'),
    },
    {
      title: 'Shopping List',
      description: 'Get optimized shopping lists for your planned meals',
      action: () => navigate('/shopping-list'),
    },
    {
      title: 'Dietary Preferences',
      description: 'Set your dietary preferences and restrictions',
      action: () => navigate('/dietary-preferences'),
    },
    {
      title: 'Route Planning',
      description: 'Find the most efficient route to your grocery stores',
      action: () => navigate('/route-selection'),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Smart Meal Planner{user?.displayName ? `, ${user.displayName}` : ''}</h1>
        <p className="text-xl text-muted-foreground">
          Your intelligent companion for meal planning and smart shopping
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={feature.action}
                className="w-full"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!user && (
        <div className="text-center mt-12">
          <p className="mb-4 text-lg">Ready to start your meal planning journey?</p>
          <div className="space-x-4">
            <Button 
              onClick={() => navigate('/signup')}
              className="px-8"
            >
              Sign Up
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="px-8"
            >
              Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
