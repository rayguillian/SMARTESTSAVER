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

// Real Danish grocery store locations
const stores = [
  // Copenhagen (København) Stores
  {
    name: "Netto",
    address: "Nørrebrogade 157, 2200 København N",
    location: { lat: 55.6943, lng: 12.5492 },
    chain: "Netto",
    region: "København"
  },
  {
    name: "Føtex",
    address: "Frederiksborggade 40, 1360 København K",
    location: { lat: 55.6835, lng: 12.5719 },
    chain: "Føtex",
    region: "København"
  },
  {
    name: "Irma",
    address: "Østerbrogade 75, 2100 København Ø",
    location: { lat: 55.7008, lng: 12.5738 },
    chain: "Irma",
    region: "København"
  },
  {
    name: "Rema 1000",
    address: "Tagensvej 70, 2200 København N",
    location: { lat: 55.7007, lng: 12.5498 },
    chain: "Rema 1000",
    region: "København"
  },
  {
    name: "Lidl",
    address: "Amagerbrogade 80, 2300 København S",
    location: { lat: 55.6614, lng: 12.5947 },
    chain: "Lidl",
    region: "København"
  },

  // Aarhus Stores
  {
    name: "Bilka",
    address: "Hasselager Centervej 1, 8260 Viby J",
    location: { lat: 56.1304, lng: 10.1579 },
    chain: "Bilka",
    region: "Aarhus"
  },
  {
    name: "Føtex",
    address: "M.P. Bruuns Gade 25, 8000 Aarhus C",
    location: { lat: 56.1497, lng: 10.2033 },
    chain: "Føtex",
    region: "Aarhus"
  },
  {
    name: "Netto",
    address: "Randersvej 80, 8200 Aarhus N",
    location: { lat: 56.1729, lng: 10.1932 },
    chain: "Netto",
    region: "Aarhus"
  },

  // Odense Stores
  {
    name: "Rema 1000",
    address: "Nyborgvej 110, 5000 Odense C",
    location: { lat: 55.3961, lng: 10.4027 },
    chain: "Rema 1000",
    region: "Odense"
  },
  {
    name: "Lidl",
    address: "Middelfartvej 50, 5200 Odense V",
    location: { lat: 55.3984, lng: 10.3631 },
    chain: "Lidl",
    region: "Odense"
  },

  // Aalborg Stores
  {
    name: "Salling",
    address: "Nytorv 8, 9000 Aalborg",
    location: { lat: 57.0488, lng: 9.9217 },
    chain: "Salling",
    region: "Aalborg"
  },
  {
    name: "Føtex",
    address: "Vesterbro 23, 9000 Aalborg",
    location: { lat: 57.0466, lng: 9.9147 },
    chain: "Føtex",
    region: "Aalborg"
  },

  // Additional Copenhagen Stores
  {
    name: "Meny",
    address: "Østerfælled Torv 37, 2100 København Ø",
    location: { lat: 55.7065, lng: 12.5816 },
    chain: "Meny",
    region: "København"
  },
  {
    name: "SuperBrugsen",
    address: "Nørrebrogade 45, 2200 København N",
    location: { lat: 55.6897, lng: 12.5563 },
    chain: "SuperBrugsen",
    region: "København"
  },
  {
    name: "Aldi",
    address: "Vesterbrogade 97, 1620 København V",
    location: { lat: 55.6697, lng: 12.5494 },
    chain: "Aldi",
    region: "København"
  },

  // Additional Aarhus Stores
  {
    name: "Fakta",
    address: "Silkeborgvej 325, 8230 Åbyhøj",
    location: { lat: 56.1527, lng: 10.1579 },
    chain: "Fakta",
    region: "Aarhus"
  },
  {
    name: "SuperBrugsen",
    address: "Jægergårdsgade 47, 8000 Aarhus C",
    location: { lat: 56.1497, lng: 10.2033 },
    chain: "SuperBrugsen",
    region: "Aarhus"
  },

  // Additional Odense Stores
  {
    name: "Bilka",
    address: "Ørbækvej 75, 5220 Odense SØ",
    location: { lat: 55.3722, lng: 10.4273 },
    chain: "Bilka",
    region: "Odense"
  },
  {
    name: "SuperBrugsen",
    address: "Vesterbro 5, 5000 Odense C",
    location: { lat: 55.4038, lng: 10.3878 },
    chain: "SuperBrugsen",
    region: "Odense"
  },

  // Additional Aalborg Stores
  {
    name: "Rema 1000",
    address: "Dannebrogsgade 43, 9000 Aalborg",
    location: { lat: 57.0502, lng: 9.9147 },
    chain: "Rema 1000",
    region: "Aalborg"
  },
  {
    name: "Netto",
    address: "Boulevarden 38, 9000 Aalborg",
    location: { lat: 57.0488, lng: 9.9217 },
    chain: "Netto",
    region: "Aalborg"
  }
];

async function populateStores() {
  try {
    const storesRef = collection(db, 'stores');
    
    for (const store of stores) {
      try {
        const docRef = await addDoc(storesRef, {
          ...store,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`Added store ${store.name} in ${store.region} with ID: ${docRef.id}`);
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
