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
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Hooks
import { useUserPreferences } from './hooks/useUserPreferences';
import { useAuth } from './contexts/AuthContext';

// Services
import { openaiService } from './services/openai';
import { fetchNearbyStores } from './services/storeService';
import UserPreferencesService from './services/UserPreferencesService';

// Firebase
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [mealSuggestions, setMealSuggestions] = useState(null);

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
          if (!userLocation) {
            console.log('No user location available yet');
            return;
          }

          const travelPrefs = {
            radius: preferences?.travel?.radius || 5000
          };

          console.log('Fetching stores with:', {
            userLocation,
            travelPrefs
          });

          const response = await fetch(
            `http://localhost:3000/api/nearbyStores?userLocation=${encodeURIComponent(JSON.stringify(userLocation))}&travelPreferences=${encodeURIComponent(JSON.stringify(travelPrefs))}`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server response error:', errorData);
            throw new Error(errorData.message || 'Failed to fetch nearby stores');
          }

          const data = await response.json();
          console.log('Received stores:', data);
          setStores(data.stores || []);
        } catch (error) {
          console.error('Error fetching stores:', error);
          setError(error.message);
        }
      };

      if (userLocation && preferences?.travel?.radius) {
        console.log('Triggering store fetch with location and preferences');
        fetchStores();
      }
    }
  }, [userLocation, preferences]);

  const handleCuisineSubmit = async (data) => {
    // Format the cuisine preferences
    const formattedPreferences = {
      ...preferences,  // Keep existing preferences
      cuisine: {
        cuisineTypes: data.cuisines,
        difficulty: data.complexity.level === 3 ? "medium" : 
                   data.complexity.level < 3 ? "easy" : "hard",
        maxPrepTime: `${data.maxCookingTime.minutes} minutes`
      }
    };

    try {
      await updatePreferences(formattedPreferences);
      await UserPreferencesService.savePreferences(formattedPreferences);
      navigate('/dietary-preferences');
    } catch (error) {
      console.error('Failed to save cuisine preferences:', error);
      setError('Failed to save cuisine preferences. Please try again.');
    }
  };

  const handleDietarySubmit = async (data) => {
    if (validateDietary(data)) {
      await logToFirebase('dietaryPreferences', data);
      
      // Format the preferences for the OpenAI service
      const formattedPreferences = {
        ...preferences,  // Keep existing preferences, including cuisine
        dietaryRestrictions: [
          ...data.dietaryRestrictions,
          ...(data.otherDietaryRestrictions ? [data.otherDietaryRestrictions] : [])
        ],
        allergens: [
          ...data.allergens,
          ...(data.otherAllergens ? [data.otherAllergens] : [])
        ]
      };

      try {
        await updatePreferences(formattedPreferences);
        await UserPreferencesService.savePreferences(formattedPreferences);

        console.log('Sending preferences to OpenAI:', JSON.stringify(formattedPreferences, null, 2));
        const suggestions = await openaiService.getMealSuggestions(formattedPreferences);
        setMealSuggestions(suggestions);
        console.log('Received meal suggestions:', JSON.stringify(suggestions, null, 2));
        navigate('/meal-selection');
      } catch (error) {
        console.error('Error getting meal suggestions:', error);
        setError('Failed to get meal suggestions. Please try again.');
      }
    } else {
      console.error('Invalid dietary data:', validateDietary.errors);
      setError('Please fill in all required dietary preferences.');
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <Navigation user={user} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/travel-preferences" element={
          <ProtectedRoute>
            <TravelPreferences 
              onSubmit={handleTravelPreferences} 
            />
          </ProtectedRoute>
        } />
        <Route path="/dietary-preferences" element={
          <ProtectedRoute>
            <DietaryPreferences 
              onSubmit={handleDietarySubmit} 
            />
          </ProtectedRoute>
        } />
        <Route path="/cuisine-preferences" element={
          <ProtectedRoute>
            <CuisinePreferences 
              onSubmit={handleCuisineSubmit} 
            />
          </ProtectedRoute>
        } />
        <Route path="/meal-selection" element={
          <ProtectedRoute>
            <MealSelection 
              onSelect={handleMealSelection} 
              preferences={preferences} 
              mealSuggestions={mealSuggestions}
            />
          </ProtectedRoute>
        } />
        <Route path="/shopping-list" element={
          <ProtectedRoute>
            <ShoppingList 
              preferences={preferences} 
            />
          </ProtectedRoute>
        } />
        <Route path="/route-selection" element={
          <ProtectedRoute>
            <RouteSelection 
              preferences={preferences} 
            />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
