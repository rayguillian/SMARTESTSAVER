import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_PREFERENCES = {
  pricePreference: 'balanced',
  organicPreference: false,
  maxStores: 3,
  searchRadius: 10,
  preferredStores: [],
  dietaryRestrictions: [],
  selectedMeal: null,
  ingredients: [],
  cuisine: [],
  dietary: {
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    custom: []
  },
  travel: {
    maxDistance: 5,
    preferredTransport: 'walking'
  },
  lastUpdated: new Date().toISOString()
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializePreferences = async () => {
      // First try to load from localStorage
      const savedPrefs = localStorage.getItem('userPreferences');
      let localPrefs = DEFAULT_PREFERENCES;
      
      try {
        if (savedPrefs) {
          localPrefs = {
            ...DEFAULT_PREFERENCES,
            ...JSON.parse(savedPrefs),
            lastUpdated: new Date().toISOString()
          };
          setPreferences(localPrefs);
        }
      } catch (err) {
        console.error('Error parsing local preferences:', err);
      }

      // If user is logged in, try to sync with Firestore
      if (user) {
        try {
          const userPrefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
          
          unsubscribe = onSnapshot(userPrefsRef, 
            (doc) => {
              if (doc.exists()) {
                const firestorePrefs = {
                  ...DEFAULT_PREFERENCES,
                  ...doc.data(),
                  lastUpdated: new Date().toISOString()
                };
                setPreferences(firestorePrefs);
                // Update localStorage as backup
                localStorage.setItem('userPreferences', JSON.stringify(firestorePrefs));
              } else {
                // Initialize Firestore with current preferences
                setDoc(userPrefsRef, localPrefs).catch(err => {
                  console.error('Error initializing Firestore preferences:', err);
                  // Continue using local preferences
                });
              }
              setLoading(false);
              setError(null);
            },
            async (err) => {
              console.error('Error fetching Firestore preferences:', err);
              if (err.code === 'permission-denied' || err.message.includes('ERR_BLOCKED_BY_CLIENT')) {
                console.log('Firestore blocked or permission denied, using local storage');
                setError('Unable to sync preferences. Using local storage.');
                // Continue with local preferences
                setLoading(false);
              } else if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying Firestore connection (${retryCount}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                initializePreferences();
              } else {
                setError('Failed to sync preferences. Using local storage.');
                setLoading(false);
              }
            }
          );
        } catch (err) {
          console.error('Error setting up Firestore listener:', err);
          setError('Unable to connect to cloud storage. Using local storage.');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializePreferences();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const updatePreferences = async (newPrefs) => {
    try {
      const updatedPrefs = {
        ...preferences,
        ...newPrefs,
        lastUpdated: new Date().toISOString()
      };

      // Always update localStorage first
      localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
      setPreferences(updatedPrefs);

      // Then try to sync with Firestore if user is logged in
      if (user) {
        try {
          const userPrefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
          await setDoc(userPrefsRef, updatedPrefs);
          setError(null);
        } catch (err) {
          console.error('Error updating Firestore preferences:', err);
          setError('Unable to sync preferences to cloud. Changes saved locally.');
          // Don't throw error since we successfully updated localStorage
        }
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences');
      throw err;
    }
  };

  return {
    preferences,
    updatePreferences,
    DEFAULT_PREFERENCES,
    loading,
    error
  };
};
