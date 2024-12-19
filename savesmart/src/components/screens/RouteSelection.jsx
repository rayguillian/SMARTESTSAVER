import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import * as turf from '@turf/turf';
import axios from 'axios';

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

function RouteSelection({ preferences, ingredients }) {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setCenter(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!userLocation || !ingredients || ingredients.length === 0) return;

      try {
        setLoading(true);
        const directionsService = new google.maps.DirectionsService();
        const placesService = new google.maps.places.PlacesService(document.createElement('div'));
        
        // Get nearby stores using Google Places API
        const request = {
          location: userLocation,
          radius: '5000', // 5km radius
          type: ['supermarket']
        };

        const stores = await new Promise((resolve, reject) => {
          placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              const storeData = results.map(place => ({
                name: place.name,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                address: place.vicinity
              }));
              resolve(storeData);
            } else {
              reject(new Error(`Places service failed: ${status}`));
            }
          });
        });

        // Calculate routes using Google Directions Service
        const routePromises = stores.map(async (store) => {
          const request = {
            origin: userLocation,
            destination: store.location,
            travelMode: google.maps.TravelMode[preferences.transportMode || 'DRIVING']
          };

          return new Promise((resolve, reject) => {
            directionsService.route(request, (result, status) => {
              if (status === 'OK') {
                resolve({
                  store,
                  directions: result,
                  duration: result.routes[0].legs[0].duration.value,
                  distance: result.routes[0].legs[0].distance.value
                });
              } else {
                reject(new Error(`Failed to get directions: ${status}`));
              }
            });
          });
        });

        const calculatedRoutes = await Promise.all(routePromises);
        setRoutes(calculatedRoutes);
        
        if (calculatedRoutes.length > 0) {
          setSelectedRoute(calculatedRoutes[0]);
          setDirections(calculatedRoutes[0].directions);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching routes:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [userLocation, ingredients, preferences.transportMode]);

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setDirections(route.directions);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-12">
        <Spinner />
        <p className="mt-4 text-muted-foreground">Generating optimal shopping routes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Shopping Routes</h1>
        <p className="text-muted-foreground mt-2">
          Select the most convenient shopping route
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {routes.map((route, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all ${
                selectedRoute === route ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleRouteSelect(route)}
            >
              <CardHeader>
                <CardTitle>Route {index + 1}</CardTitle>
                <CardDescription>
                  {route.store.name} • {Math.round(route.distance / 1000)}km, 
                  {Math.round(route.duration / 60)} mins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-medium">$50.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Savings:</span>
                    <span className="text-green-600 font-medium">
                      $10.99
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel Time:</span>
                    <span>{Math.round(route.duration / 60)} mins</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Stores:</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between text-sm">
                      <span>{route.store.name}</span>
                      <span className="text-muted-foreground">
                        10 items
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky top-6">
          <Card>
            <CardContent className="p-0">
              <div className="h-[400px] w-full">
                <LoadScript
                  googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  libraries={["places"]}
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={12}
                    options={{
                      mapId: import.meta.env.VITE_GOOGLE_MAP_ID
                    }}
                  >
                    {userLocation && <Marker position={userLocation} />}
                    {directions && (
                      <DirectionsRenderer
                        directions={directions}
                        options={{
                          suppressMarkers: false
                        }}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedRoute && (
        <div className="mt-8 text-center">
          <Button size="lg">
            Start Shopping Trip
          </Button>
        </div>
      )}
    </div>
  );
}

export default RouteSelection;
