import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { 
    user: user?.email, 
    loading, 
    path: location.pathname 
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to login');
    // Save the attempted path to redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  console.log('User authenticated, rendering protected content');
  return children;
}
