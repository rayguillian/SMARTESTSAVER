import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ShoppingCart, Utensils, MapPin, DollarSign } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Utensils className="h-6 w-6" />,
      title: "Smart Meal Planning",
      description: "Get personalized meal suggestions based on your preferences and dietary requirements."
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "Optimized Shopping",
      description: "Find the best deals and create efficient shopping lists for your meals."
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Route Planning",
      description: "Get the most efficient route to visit stores and save time."
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Cost Savings",
      description: "Compare prices across stores and find the best deals in your area."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to SaveSmart</h1>
        <p className="text-xl text-muted-foreground">
          Your smart companion for meal planning and grocery shopping
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                {feature.icon}
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          className="px-8"
          onClick={() => navigate('/preferences/cuisine')}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
