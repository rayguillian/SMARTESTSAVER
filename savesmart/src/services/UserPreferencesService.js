import { db, auth } from './firebaseService';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

class UserPreferencesService {
  static async savePreferences(preferences) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const userDoc = doc(db, 'user_preferences', user.uid);
      await setDoc(userDoc, preferences, { merge: true });
      console.log('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  static async getPreferences() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const userDoc = doc(db, 'user_preferences', user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log('No preferences found');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving preferences:', error);
      return null;
    }
  }

  static async deletePreferences() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const userDoc = doc(db, 'user_preferences', user.uid);
      await deleteDoc(userDoc);
      console.log('Preferences deleted successfully');
    } catch (error) {
      console.error('Error deleting preferences:', error);
    }
  }
}

export default UserPreferencesService;
