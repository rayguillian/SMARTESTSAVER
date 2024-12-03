import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

// Simplified version of StoreService for the script
async function searchNearbyStores(location, radius = 500, keyword = '') {
  try {
    const locationStr = `${location.lat},${location.lng}`;
    console.log(`Searching for stores near ${locationStr} with keyword "${keyword}"`);

    const response = await axios.get(`${PLACES_API_BASE}/nearbysearch/json`, {
      params: {
        location: locationStr,
        radius,
        keyword,
        type: 'grocery_or_supermarket',
        key: GOOGLE_API_KEY
      }
    });

    console.log('Google Places API Response:', response.data);

    if (response.data.status === 'OK') {
      return response.data.results;
    }
    throw new Error(`Failed to search nearby stores: ${response.data.status}`);
  } catch (error) {
    console.error('Error searching nearby stores:', error);
    throw error;
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmKBIQ-NOjqdczI7jdsx0vZt1wP1O-UA0",
  authDomain: "dagligruten.firebaseapp.com",
  projectId: "dagligruten",
  storageBucket: "dagligruten.firebasestorage.app",
  messagingSenderId: "42364273714",
  appId: "1:42364273714:web:b31fd3ec4bdc2007bee82b",
  measurementId: "G-7XEKYM9VH1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateStoresWithPlaceIds() {
  try {
    const storesRef = collection(db, 'stores');
    const snapshot = await getDocs(storesRef);

    console.log(`Found ${snapshot.docs.length} stores to process`);

    for (const storeDoc of snapshot.docs) {
      const store = storeDoc.data();
      console.log('Processing store:', store);
      
      // Skip if already has placeId
      if (store.placeId) {
        console.log(`Store ${store.name} already has placeId: ${store.placeId}`);
        continue;
      }

      // Check if store has valid location
      if (!store.location || typeof store.location.latitude !== 'number' || typeof store.location.longitude !== 'number') {
        console.log(`Store ${store.name} has invalid location:`, store.location);
        continue;
      }

      try {
        console.log(`Processing store: ${store.name}`);
        
        // Search for the store using its name and location
        const searchResults = await searchNearbyStores(
          {
            lat: store.location.latitude,
            lng: store.location.longitude
          },
          500,
          store.name
        );

        if (searchResults && searchResults.length > 0) {
          // Use the first result as it's likely the most relevant
          const placeId = searchResults[0].place_id;
          
          // Update the store document with the place_id
          await updateDoc(doc(db, 'stores', storeDoc.id), {
            placeId: placeId
          });

          console.log(`Updated store ${store.name} with place_id: ${placeId}`);
        } else {
          console.log(`No place found for store: ${store.name}`);
        }
      } catch (error) {
        console.error(`Error updating store ${store.name}:`, error);
      }

      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('Finished updating stores with place IDs');
  } catch (error) {
    console.error('Error updating stores:', error);
  } finally {
    // Exit the process when done
    process.exit(0);
  }
}

updateStoresWithPlaceIds();
