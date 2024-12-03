import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmKBIQ-NOjqdczI7jdsx0vZt1wP1O-UA0",
  authDomain: "dagligruten.firebaseapp.com",
  projectId: "dagligruten",
  storageBucket: "dagligruten.firebasestorage.app",
  messagingSenderId: "42364273714",
  appId: "1:42364273714:web:b31fd3ec4bdc2007bee82b",
  measurementId: "G-7XEKYM9VH1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Danish grocery store data
const stores = [
  {
    name: "Netto",
    address: "Nørrebrogade 157, 2200 København",
    location: {
      lat: 55.6943,
      lng: 12.5492
    }
  },
  {
    name: "Føtex",
    address: "Frederiksborggade 40, 1360 København",
    location: {
      lat: 55.6835,
      lng: 12.5719
    }
  },
  {
    name: "Bilka",
    address: "Fields Shopping Center, 2300 København",
    location: {
      lat: 55.6374,
      lng: 12.5781
    }
  },
  {
    name: "Rema 1000",
    address: "Østerbrogade 62, 2100 København",
    location: {
      lat: 55.7007,
      lng: 12.5738
    }
  },
  {
    name: "Lidl",
    address: "Amagerbrogade 80, 2300 København",
    location: {
      lat: 55.6614,
      lng: 12.5947
    }
  },
  {
    name: "Irma",
    address: "Øster Farimagsgade 28, 2100 København",
    location: {
      lat: 55.6889,
      lng: 12.5731
    }
  },
  {
    name: "Aldi",
    address: "Vesterbrogade 97, 1620 København",
    location: {
      lat: 55.6697,
      lng: 12.5494
    }
  },
  {
    name: "Fakta",
    address: "Godthåbsvej 195, 2720 Vanløse",
    location: {
      lat: 55.6876,
      lng: 12.4894
    }
  },
  {
    name: "Meny",
    address: "Østerfælled Torv 37, 2100 København",
    location: {
      lat: 55.7065,
      lng: 12.5816
    }
  },
  {
    name: "SuperBrugsen",
    address: "Nørrebrogade 45, 2200 København",
    location: {
      lat: 55.6897,
      lng: 12.5563
    }
  }
];

async function populateStores() {
  try {
    const storesRef = collection(db, 'stores');
    
    for (const store of stores) {
      try {
        const docRef = await addDoc(storesRef, store);
        console.log(`Added store ${store.name} with ID: ${docRef.id}`);
      } catch (error) {
        console.error(`Error adding store ${store.name}:`, error);
      }
    }
    
    console.log('Finished populating stores');
    process.exit(0);
  } catch (error) {
    console.error('Error in populateStores:', error);
    process.exit(1);
  }
}

// Run the population script
populateStores();
