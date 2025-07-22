import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { showError } from '@/utils/toast';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
    // The redirect is handled automatically by the AuthProvider and ProtectedRoute
    // after the session state changes. We navigate to / to be explicit and fast.
    navigate('/');
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