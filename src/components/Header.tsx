import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { showError } from '@/utils/toast';

const Header = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // The redirect is now fully handled by the AuthContext state change
      // and the ProtectedRoute component.
    } catch (error) {
      showError('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
      console.error('Error logging out:', error);
      setIsLoggingOut(false); // Only reset on error, as success causes unmount
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">FREELANCER HUNTER</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
          <span className="sr-only">Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;