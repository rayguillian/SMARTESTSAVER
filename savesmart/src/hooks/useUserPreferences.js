import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import { useAuth } from './useAuth';

const DEFAULT_PREFERENCES = {
  pricePreference: 'balanced', // 'budget', 'balanced', 'quality'
  organicPreference: false,
  maxStores: 3,
  searchRadius: 10, // km
  preferredStores: [], // array of store chain IDs
  dietaryRestrictions: [], // array of dietary restrictions
  selectedMeal: null,
  ingredients: [],
  cuisine: [],
  dietary: {},
  travel: {},
  lastUpdated: new Date().toISOString()
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe;

    if (user) {
      // Subscribe to user preferences in Firestore
      const userPrefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
      unsubscribe = onSnapshot(userPrefsRef, (doc) => {
        if (doc.exists()) {
          setPreferences(prev => ({
            ...DEFAULT_PREFERENCES,
            ...doc.data()
          }));
        } else {
          // Initialize preferences in Firestore
          updateDoc(userPrefsRef, DEFAULT_PREFERENCES);
        }
        setLoading(false);
      });
    } else {
      // Use local storage for non-authenticated users
      const savedPrefs = localStorage.getItem('userPreferences');
      setPreferences(savedPrefs ? { 
        ...DEFAULT_PREFERENCES, 
        ...JSON.parse(savedPrefs) 
      } : DEFAULT_PREFERENCES);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const updatePreferences = async (newPrefs) => {
    const updatedPrefs = {
      ...preferences,
      ...newPrefs,
      lastUpdated: new Date().toISOString()
    };

    if (user) {
      // Update preferences in Firestore
      try {
        const userPrefsRef = doc(db, 'users', user.uid, 'preferences', 'settings');
        await updateDoc(userPrefsRef, updatedPrefs);
      } catch (error) {
        console.error('Error updating preferences:', error);
        throw error;
      }
    } else {
      // Update preferences in local storage
      setPreferences(updatedPrefs);
      localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
    }
  };

  return {
    preferences,
    updatePreferences,
    DEFAULT_PREFERENCES,
    loading
  };
};
