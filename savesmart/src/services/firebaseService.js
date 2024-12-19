import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc, doc } from "firebase/firestore";
import { app, db, auth } from "../config/firebaseConfig";

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
      FirebaseService.#instance = new FirebaseService();
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

  async getUserPreferences(userId) {
    try {
      const userPrefsRef = collection(db, 'users', userId, 'preferences');
      const q = query(userPrefsRef, where('type', '==', 'preferences'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const userPrefsRef = doc(db, 'users', userId, 'preferences', 'settings');
      await updateDoc(userPrefsRef, {
        ...preferences,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async saveUserPreferences(userId, preferences) {
    try {
      const userPrefsRef = collection(db, 'users', userId, 'preferences');
      await addDoc(userPrefsRef, {
        ...preferences,
        type: 'preferences',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }
}

const firebaseService = FirebaseService.getInstance();
export { db, auth, firebaseService };
