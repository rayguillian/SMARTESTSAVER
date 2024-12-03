import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import { useAuth } from './useAuth';
import { generateRoutes } from '../services/routeService';

export const useShoppingList = () => {
  const [shoppingLists, setShoppingLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe;

    if (user) {
      const listsRef = collection(db, 'users', user.uid, 'shoppingLists');
      const q = query(listsRef, where('status', '!=', 'completed'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const lists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setShoppingLists(lists);
        
        // Set active list to the most recent non-completed list
        const activeLists = lists.filter(list => list.status === 'active');
        if (activeLists.length > 0) {
          setActiveList(activeLists[0]);
        }
        
        setLoading(false);
      });
    } else {
      // Handle non-authenticated users
      const savedList = localStorage.getItem('activeShoppingList');
      if (savedList) {
        setActiveList(JSON.parse(savedList));
      }
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const createList = async (ingredients, preferences) => {
    try {
      const newList = {
        ingredients,
        preferences,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (user) {
        const listsRef = collection(db, 'users', user.uid, 'shoppingLists');
        const docRef = await addDoc(listsRef, newList);
        return { id: docRef.id, ...newList };
      } else {
        localStorage.setItem('activeShoppingList', JSON.stringify(newList));
        setActiveList(newList);
        return newList;
      }
    } catch (error) {
      console.error('Error creating shopping list:', error);
      throw error;
    }
  };

  const updateList = async (listId, updates) => {
    try {
      const updatedList = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (user) {
        const listRef = doc(db, 'users', user.uid, 'shoppingLists', listId);
        await updateDoc(listRef, updatedList);
      } else {
        const newList = { ...activeList, ...updatedList };
        localStorage.setItem('activeShoppingList', JSON.stringify(newList));
        setActiveList(newList);
      }
    } catch (error) {
      console.error('Error updating shopping list:', error);
      throw error;
    }
  };

  const deleteList = async (listId) => {
    try {
      if (user) {
        const listRef = doc(db, 'users', user.uid, 'shoppingLists', listId);
        await deleteDoc(listRef);
      } else {
        localStorage.removeItem('activeShoppingList');
        setActiveList(null);
      }
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      throw error;
    }
  };

  const generateShoppingRoutes = async (userLocation) => {
    if (!activeList) return;

    try {
      const routes = await generateRoutes(activeList.ingredients, {
        radius: activeList.preferences.searchRadius || 10,
        maxStores: activeList.preferences.maxStores || 3,
        userLocation
      });

      setRoutes(routes);

      // Save routes if user is authenticated
      if (user && activeList.id) {
        const listRef = doc(db, 'users', user.uid, 'shoppingLists', activeList.id);
        await updateDoc(listRef, {
          routes,
          updatedAt: new Date().toISOString()
        });
      }

      return routes;
    } catch (error) {
      console.error('Error generating routes:', error);
      throw error;
    }
  };

  return {
    shoppingLists,
    activeList,
    routes,
    loading,
    createList,
    updateList,
    deleteList,
    generateShoppingRoutes
  };
};
