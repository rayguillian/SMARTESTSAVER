import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './button';
import { ArrowLeft, Home, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isHomePage = location.pathname === '/';
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm border-b z-50">
      <div className="flex gap-2">
        {!isHomePage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {!isHomePage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            aria-label="Go home"
          >
            <Home className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-lg font-semibold">SaveSmart</h1>
      </div>

      <div className="flex gap-2">
        {user ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{user.displayName || user.email}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </>
        ) : (
          !location.pathname.includes('login') && !location.pathname.includes('signup') && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          )
        )}
      </div>
    </div>
  );
}
