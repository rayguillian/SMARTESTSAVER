import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with error handling
let app;
let db;
let auth;
let analytics = null;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase API key is missing. Check your environment variables.');
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  try {
    analytics = getAnalytics(app);
  } catch (analyticsError) {
    console.log('Analytics disabled:', analyticsError.message);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

export { db, auth };

class FirebaseService {
  static #instance = null;

  constructor() {
    if (FirebaseService.#instance) {
      return FirebaseService.#instance;
    }
    FirebaseService.#instance = this;
  }

  static getInstance() {
    if (!FirebaseService.#instance) {
      new FirebaseService();
    }
    return FirebaseService.#instance;
  }

  // Store Operations
  async getStores() {
    try {
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      return storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting stores:', error);
      throw error;
    }
  }

  // Price Operations
  async getPrices(productIds) {
    try {
      const q = query(
        collection(db, 'prices'),
        where('productId', 'in', productIds)
      );
      const pricesSnapshot = await getDocs(q);
      return pricesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting prices:', error);
      throw error;
    }
  }

  async updatePrice(priceId, newPrice) {
    try {
      const priceRef = doc(db, 'prices', priceId);
      await updateDoc(priceRef, { price: newPrice });
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  }

  // Product Operations
  async getProducts(searchTerms = []) {
    try {
      let q;
      if (searchTerms.length > 0) {
        q = query(
          collection(db, 'products'),
          where('tags', 'array-contains-any', searchTerms)
        );
      } else {
        q = collection(db, 'products');
      }
      
      const productsSnapshot = await getDocs(q);
      return productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async addProduct(product) {
    try {
      const docRef = await addDoc(collection(db, 'products'), product);
      return {
        id: docRef.id,
        ...product
      };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
