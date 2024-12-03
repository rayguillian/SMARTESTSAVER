import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Components
import { Navigation } from './components/ui/navigation';
import { HomePage } from './components/screens/HomePage';
import TravelPreferences from './components/screens/TravelPreferences';
import DietaryPreferences from './components/screens/DietaryPreferences';
import CuisinePreferences from './components/screens/CuisinePreferences';
import MealSelection from './components/screens/MealSelection';
import ShoppingList from './components/screens/ShoppingList';
import RouteSelection from './components/screens/RouteSelection';
import SignInPage from './components/SignInPage'; // Assume you have a SignInPage component

// Hooks
import { useUserPreferences } from './hooks/useUserPreferences';

// Services
import { openaiService } from './services/openai';
import { fetchNearbyStores } from './services/storeService';
import UserPreferencesService from './services/UserPreferencesService';

// Firebase
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import Ajv from 'ajv'; // Added import statement for Ajv

const ajv = new Ajv();
const db = getFirestore();
const auth = getAuth();

const dietarySchema = {
  type: 'object',
  properties: {
    dietaryRestrictions: { type: 'array', items: { type: 'string' } },
    otherDietaryRestrictions: { type: 'string' },
    allergens: { type: 'array', items: { type: 'string' } },
    otherAllergens: { type: 'string' }
  },
  required: ['dietaryRestrictions', 'allergens'],
  additionalProperties: false
};

const cuisineSchema = {
  type: 'object',
  properties: {
    cuisines: { type: 'array', items: { type: 'string' } },
    complexity: { type: 'object', properties: { level: { type: 'number' } }, required: ['level'] },
    maxCookingTime: { type: 'object', properties: { minutes: { type: 'number' } }, required: ['minutes'] }
  },
  required: ['cuisines', 'complexity', 'maxCookingTime'],
  additionalProperties: false
};

const validateDietary = ajv.compile(dietarySchema);
const validateCuisine = ajv.compile(cuisineSchema);

async function logToFirebase(collection, data) {
  const docRef = doc(db, collection, Date.now().toString());
  await setDoc(docRef, data);
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useUserPreferences();
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        navigate('/sign-in'); // Redirect to sign-in page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    if (user) {
      const fetchPreferences = async () => {
        try {
          const savedPreferences = await UserPreferencesService.getPreferences();
          if (savedPreferences) {
            updatePreferences(savedPreferences);
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      };
      fetchPreferences();
    }
  }, [user]);

  useEffect(() => {
    const fetchPreferences = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.warn('User not authenticated. Skipping preference loading.');
        return;
      }

      try {
        const savedPreferences = await UserPreferencesService.getPreferences();
        if (savedPreferences) {
          updatePreferences(savedPreferences);
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    };
    fetchPreferences();
  }, []);

  const handleLocationSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    setUserLocation({ latitude, longitude });
    setLocationError(null);
  };

  const handleLocationError = (error) => {
    setLocationError({
      code: error.code,
      message: error.message
    });
    setUserLocation(null);
  };

  const locationOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError({
        code: 'GEOLOCATION_NOT_SUPPORTED',
        message: 'Geolocation is not supported by your browser'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      locationOptions
    );
  };

  const requestLocationPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        setLocationPermissionGranted(true);
        getLocation();
      } else if (result.state === 'prompt') {
        // Will show the permission prompt
        getLocation();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  useEffect(() => {
    // Instead of requesting location immediately, we'll wait for user interaction
    // The location request will be triggered by a button click or other user action
    if (locationPermissionGranted) {
      const watchId = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        locationOptions
      );

      return () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }
  }, [locationPermissionGranted]);

  useEffect(() => {
    // Initial location permission request
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Update stores when location changes
    if (userLocation) {
      const fetchStores = async () => {
        try {
          const travelPrefs = {
            radius: preferences?.travel?.radius || 5000
          };

          const response = await fetch(
            `http://localhost:3000/api/nearbyStores?userLocation=${encodeURIComponent(JSON.stringify(userLocation))}&travelPreferences=${encodeURIComponent(JSON.stringify(travelPrefs))}`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error?.includes('rate limit exceeded')) {
              throw new Error('OpenAI rate limit reached. Please try again in about an hour.');
            }
            throw new Error(errorData.message || 'Failed to fetch nearby stores');
          }

          const data = await response.json();
          setStores(data.stores || []);
        } catch (error) {
          console.error('Error fetching stores:', error);
          setError(error.message);
          // Don't set location error since it's not a location-specific issue
        }
      };
      fetchStores();
    }
  }, [userLocation, preferences]);

  const handleCuisinePreferences = async (data) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated. Cannot save preferences.');
      return;
    }

    try {
      await updatePreferences({ cuisine: data });
    } catch (error) {
      console.error('Error saving preferences:', error);
      if (error.code === 'not-found') {
        // If document doesn't exist, create it
        try {
          await setDoc(doc(db, 'users', user.uid, 'preferences', 'settings'), {
            cuisine: data
          });
        } catch (setDocError) {
          console.error('Error creating preferences document:', setDocError);
        }
      }
    }
  };

  const handleDietaryPreferences = async (data) => {
    if (validateDietary(data)) {
      await logToFirebase('dietaryPreferences', data);
      const updatedPreferences = { ...preferences, dietary: data, cuisine: preferences.cuisine || {} };
      await updatePreferences(updatedPreferences);
      await UserPreferencesService.savePreferences(updatedPreferences);
      if (updatedPreferences.cuisine && updatedPreferences.dietary) {
        await openaiService.getMealSuggestions(updatedPreferences);
      }
      navigate('/meal-selection');
    } else {
      console.error('Invalid dietary data:', validateDietary.errors);
    }
  };

  const handleDeletePreferences = async () => {
    try {
      await UserPreferencesService.deletePreferences();
      updatePreferences({});
      console.log('Preferences deleted successfully');
    } catch (error) {
      console.error('Failed to delete preferences:', error);
    }
  };

  const handleMealSelection = (meal) => {
    setSelectedMeal(meal);
    // Store the meal and ingredients in preferences
    updatePreferences({
      selectedMeal: meal,
      ingredients: meal.ingredients || []
    });
    navigate('/shopping-list');
  };

  const handleTravelPreferences = async (data) => {
    await updatePreferences({ 
      location: data.location,
      searchRadius: data.searchRadius,
      maxStores: data.maxStores,
      transportMode: data.transportMode 
    });
    await UserPreferencesService.savePreferences(preferences);
    navigate('/preferences/cuisine');
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking auth state
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-6 px-4">
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/preferences/travel" 
            element={
              <TravelPreferences 
                onSubmit={handleTravelPreferences} 
              />
            } 
          />
          <Route 
            path="/preferences/cuisine" 
            element={<CuisinePreferences onSubmit={handleCuisinePreferences} />} 
          />
          <Route 
            path="/preferences/dietary" 
            element={<DietaryPreferences onSubmit={handleDietaryPreferences} />} 
          />
          <Route 
            path="/meal-selection" 
            element={<MealSelection onSelect={handleMealSelection} preferences={preferences} />} 
          />
          <Route 
            path="/shopping-list" 
            element={<ShoppingList preferences={preferences} />} 
          />
          <Route 
            path="/route" 
            element={<RouteSelection preferences={preferences} />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
