import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import App from './App';
import DietaryPreferences from './components/screens/DietaryPreferences';
import MealSelection from './components/screens/MealSelection';
import ShoppingList from './components/screens/ShoppingList';
import Settings from './components/screens/Settings';

// Configure future flags for React Router v7
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  }
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<MealSelection />} />
      <Route path="dietary-preferences" element={<DietaryPreferences />} />
      <Route path="shopping-list" element={<ShoppingList />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  ),
  routerConfig
);

export default router;
