import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './button';
import { ArrowLeft, Home } from 'lucide-react';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

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
    </div>
  );
}
