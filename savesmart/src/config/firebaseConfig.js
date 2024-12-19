import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCmKBIQ-NOjqdczI7jdsx0vZt1wP1O-UA0",
  authDomain: "dagligruten.firebaseapp.com",
  databaseURL: "https://dagligruten-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dagligruten",
  storageBucket: "dagligruten.firebasestorage.app",
  messagingSenderId: "42364273714",
  appId: "1:42364273714:web:b31fd3ec4bdc2007bee82b",
  measurementId: "G-7XEKYM9VH1"
};

// Initialize Firebase
let app;

// Check if Firebase app is already initialized
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.log('Persistence not supported by browser');
    }
  });