import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import App from './App';
import { HomePage } from './components/screens/HomePage';
import DietaryPreferences from './components/screens/DietaryPreferences';
import CuisinePreferences from './components/screens/CuisinePreferences';
import MealSelection from './components/screens/MealSelection';
import ShoppingList from './components/screens/ShoppingList';
import Settings from './components/screens/Settings';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';

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
      <Route index element={<HomePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignUpPage />} />
      <Route path="cuisine-preferences" element={<CuisinePreferences />} />
      <Route path="dietary-preferences" element={<DietaryPreferences />} />
      <Route path="meal-selection" element={<MealSelection />} />
      <Route path="shopping-list" element={<ShoppingList />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  ),
  routerConfig
);

export default router;
