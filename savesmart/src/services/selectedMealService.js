import { db } from './firebaseService';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const SELECTED_MEALS_COLLECTION = 'selectedMeals';

export class SelectedMealService {
  static async saveSelectedMeal(userId, meal) {
    try {
      const mealData = {
        userId,
        name: meal.name,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        cookingTime: meal.cookingTime,
        cuisine: meal.cuisine,
        dietaryRestrictions: meal.dietaryRestrictions,
        timestamp: serverTimestamp(),
        isCompleted: false
      };

      const docRef = await addDoc(collection(db, SELECTED_MEALS_COLLECTION), mealData);
      return { id: docRef.id, ...mealData };
    } catch (error) {
      console.error('Error saving selected meal:', error);
      // Store in localStorage as backup
      const localMeals = JSON.parse(localStorage.getItem('selectedMeals') || '[]');
      localMeals.push({ ...meal, timestamp: new Date().toISOString() });
      localStorage.setItem('selectedMeals', JSON.stringify(localMeals));
      throw error;
    }
  }

  static async getUserSelectedMeals(userId) {
    try {
      const q = query(
        collection(db, SELECTED_MEALS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user selected meals:', error);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem('selectedMeals') || '[]');
    }
  }

  static async markMealAsCompleted(mealId) {
    try {
      const mealRef = doc(db, SELECTED_MEALS_COLLECTION, mealId);
      await updateDoc(mealRef, {
        isCompleted: true,
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking meal as completed:', error);
      // Update in localStorage
      const localMeals = JSON.parse(localStorage.getItem('selectedMeals') || '[]');
      const updatedMeals = localMeals.map(meal => 
        meal.id === mealId ? { ...meal, isCompleted: true, completedAt: new Date().toISOString() } : meal
      );
      localStorage.setItem('selectedMeals', JSON.stringify(updatedMeals));
      throw error;
    }
  }
}

export const selectedMealService = new SelectedMealService();
