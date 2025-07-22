import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Redirige inmediatamente para una experiencia de usuario instantánea.
    navigate('/');
    // El cierre de sesión se ejecuta en segundo plano.
    supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">FREELANCER HUNTER</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;