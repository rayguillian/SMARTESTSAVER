import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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

// Danish grocery products with realistic data
const products = [
  {
    name: "Arla Letmælk",
    description: "1 liter økologisk letmælk",
    category: "Mejeriprodukter",
    unit: "L",
    defaultUnit: "L"
  },
  {
    name: "Schulstad Kernerugbrød",
    description: "Friskbagt rugbrød med kerner",
    category: "Brød",
    unit: "stk",
    defaultUnit: "stk"
  },
  {
    name: "Danske Æg - Økologiske",
    description: "10 stk store æg fra fritgående høns",
    category: "Æg & Mejeriprodukter",
    unit: "pakke",
    defaultUnit: "pakke"
  },
  {
    name: "Hakket Oksekød 8-12%",
    description: "400g hakket oksekød",
    category: "Kød",
    unit: "pakke",
    defaultUnit: "pakke"
  },
  {
    name: "Lurpak Smør",
    description: "200g saltet smør",
    category: "Mejeriprodukter",
    unit: "stk",
    defaultUnit: "stk"
  },
  {
    name: "Heinz Ketchup",
    description: "500ml original ketchup",
    category: "Krydderier & Sauce",
    unit: "flaske",
    defaultUnit: "flaske"
  },
  {
    name: "Danske Gulerødder",
    description: "1kg økologiske gulerødder",
    category: "Grøntsager",
    unit: "pose",
    defaultUnit: "pose"
  },
  {
    name: "Kartofler",
    description: "1.5kg danske kartofler",
    category: "Grøntsager",
    unit: "pose",
    defaultUnit: "pose"
  },
  {
    name: "Barilla Spaghetti",
    description: "500g kvalitets pasta",
    category: "Pasta & Ris",
    unit: "pakke",
    defaultUnit: "pakke"
  },
  {
    name: "Neutral Vaskepulver",
    description: "1kg miljøvenligt vaskepulver",
    category: "Husholdning",
    unit: "pakke",
    defaultUnit: "pakke"
  }
];

// Function to generate random price variations
const generatePrice = (basePrice, variance = 0.2) => {
  const variation = (Math.random() * 2 - 1) * variance;
  return +(basePrice * (1 + variation)).toFixed(2);
};

// Base prices for products (in DKK)
const basePrices = {
  "Arla Letmælk": 13.95,
  "Schulstad Kernerugbrød": 22.95,
  "Danske Æg - Økologiske": 39.95,
  "Hakket Oksekød 8-12%": 45.95,
  "Lurpak Smør": 28.95,
  "Heinz Ketchup": 24.95,
  "Danske Gulerødder": 18.95,
  "Kartofler": 19.95,
  "Barilla Spaghetti": 16.95,
  "Neutral Vaskepulver": 49.95
};

async function populateProducts() {
  try {
    console.log('Starting to populate products...');
    const productsRef = collection(db, 'products');
    const productDocs = [];

    // Add products
    for (const product of products) {
      try {
        const docRef = await addDoc(productsRef, {
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`Added product ${product.name} with ID: ${docRef.id}`);
        productDocs.push({ id: docRef.id, ...product });
      } catch (error) {
        console.error(`Error adding product ${product.name}:`, error);
      }
    }

    // Get all stores
    const storesRef = collection(db, 'stores');
    const storesSnapshot = await getDocs(storesRef);
    const stores = storesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Starting to populate prices...');
    const pricesRef = collection(db, 'prices');

    // Add prices for each product in each store
    for (const product of productDocs) {
      for (const store of stores) {
        try {
          const basePrice = basePrices[product.name];
          const price = generatePrice(basePrice);
          
          await addDoc(pricesRef, {
            productId: product.id,
            storeId: store.id,
            price: price,
            unit: product.unit,
            currency: 'DKK',
            updatedAt: new Date().toISOString()
          });
          console.log(`Added price for ${product.name} at ${store.name}: ${price} DKK`);
        } catch (error) {
          console.error(`Error adding price for ${product.name} at ${store.name}:`, error);
        }
      }
    }

    console.log('Finished populating products and prices');
    process.exit(0);
  } catch (error) {
    console.error('Error in population script:', error);
    process.exit(1);
  }
}

// Run the population script
populateProducts();
