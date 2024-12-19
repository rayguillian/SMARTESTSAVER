import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { mapService } from '../../services/mapService';
import { storeService } from '../../services/storeService';
import { Spinner } from '../ui/spinner';

function ShoppingList() {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useUserPreferences();
  const [checkedItems, setCheckedItems] = useState({});
  const mapRef = useRef(null);
  const [stores, setStores] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  const defaultLocation = { lat: 55.6761, lng: 12.5683 }; // Copenhagen
  const location = preferences?.location || defaultLocation;

  const handleToggleItem = async (ingredientName) => {
    const newCheckedItems = {
      ...checkedItems,
      [ingredientName]: !checkedItems[ingredientName]
    };
    setCheckedItems(newCheckedItems);
  };

  // Load map and calculate routes
  useEffect(() => {
    let mounted = true;

    const loadMapAndRoutes = async () => {
      // Add a timeout to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        if (mounted) {
          setMapLoading(false);
          setMapError('Map initialization timed out');
        }
      }, 10000); // 10 seconds timeout

      try {
        // Ensure map ref exists before proceeding
        const currentMapRef = mapRef.current;
        if (!currentMapRef) {
          console.log('Map ref not available yet');
          return;
        }

        setMapLoading(true);
        setMapError(null);

        console.log('Initializing map...');
        await mapService.initialize();
        
        if (!mounted) return;

        console.log('Setting up map with ref...', currentMapRef);
        await mapService.initializeMap(currentMapRef);
        console.log('Map initialized successfully');

        // Only proceed with store search if we have ingredients
        if (mounted && preferences?.ingredients?.length) {
          console.log('Searching for nearby stores...');
          const nearbyStores = await mapService.searchNearbyStores(location, 5000);
          if (!mounted) return;
          
          console.log('Found stores:', nearbyStores);
          setStores(nearbyStores);

          if (nearbyStores?.length) {
            const optimizedRoutes = await mapService.calculateRoutes(
              location,
              nearbyStores.slice(0, 3),
              preferences.ingredients
            );
            
            if (!mounted) return;

            if (optimizedRoutes?.length) {
              setRoutes(optimizedRoutes);
              setSelectedRoute(optimizedRoutes[0]);
              await mapService.displayRoute(optimizedRoutes[0]);
            }
          }
        }

        // Clear timeout if everything succeeds
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Error in map initialization:', err);
        if (mounted) {
          setMapError('Could not load store locations. Shopping list is still available.');
        }
      } finally {
        if (mounted) {
          setMapLoading(false);
        }
      }
    };

    // Initial load
    loadMapAndRoutes();

    // Cleanup
    return () => {
      mounted = false;
      mapService.cleanup();
    };
  }, [preferences?.ingredients, location]); // More comprehensive dependencies

  // Separate effect for handling location changes
  useEffect(() => {
    if (mapRef.current && !mapLoading) {
      mapService.updateMapCenter(location);
    }
  }, [location, mapLoading]);

  const handleRouteSelect = async (route) => {
    try {
      setSelectedRoute(route);
      await mapService.displayRoute(route);
    } catch (err) {
      console.error('Error displaying route:', err);
    }
  };

  if (!preferences?.selectedMeal || !preferences?.ingredients?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Items in Shopping List</CardTitle>
            <CardDescription>Please select a meal first to generate your shopping list.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/meal-selection')}>
              Select a Meal
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shopping List Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shopping List for {preferences.selectedMeal.name}</CardTitle>
              <CardDescription>Check off items as you add them to your cart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preferences.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={`ingredient-${index}`}
                      checked={checkedItems[ingredient.name] || false}
                      onCheckedChange={() => handleToggleItem(ingredient.name)}
                    />
                    <div className="flex flex-1 justify-between items-center">
                      <label
                        htmlFor={`ingredient-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {ingredient.name}
                      </label>
                      {ingredient.amount && (
                        <span className="text-sm text-muted-foreground">
                          {ingredient.amount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/meal-selection')}>
                Back to Meals
              </Button>
              <div className="text-sm text-muted-foreground">
                {Object.values(checkedItems).filter(Boolean).length} of {preferences.ingredients.length} items checked
              </div>
            </CardFooter>
          </Card>

          {/* Routes Section */}
          {routes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Routes</CardTitle>
                <CardDescription>Select a route to view on the map</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {routes.map((route, index) => (
                    <Button
                      key={index}
                      variant={selectedRoute === route ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleRouteSelect(route)}
                    >
                      <div className="flex flex-col items-start">
                        <span>Route {index + 1}</span>
                        <span className="text-sm text-muted-foreground">
                          {route.stores.length} stores • {Math.round(route.totalDistance / 1000)}km • 
                          {Math.round(route.totalTime / 60)} mins
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map Section */}
        <div className="lg:order-last">
          <Card>
            <CardContent className="p-0">
              <div className="w-full h-[400px] lg:h-[600px] rounded-lg overflow-hidden">
                {mapLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Spinner />
                  </div>
                ) : (
                  <div ref={mapRef} className="w-full h-full" />
                )}
              </div>
            </CardContent>
            {mapError && (
              <CardFooter>
                <p className="text-sm text-muted-foreground">{mapError}</p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ShoppingList;