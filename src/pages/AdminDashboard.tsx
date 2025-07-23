import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  type: 'client' | 'provider';
  category: string | null;
  skill: string | null;
  rate: number | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, country, state, city, type, category, skill, rate');

      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProviders(data.filter(p => p.type === 'provider'));
        setClients(data.filter(p => p.type === 'client'));
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">Panel de Administrador</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Cerrar Sesión</span>
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {loading ? (
          <p>Cargando datos...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Providers Column */}
            <Card>
              <CardHeader>
                <CardTitle>Proveedores ({providers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-4">
                    {providers.map(provider => (
                      <div key={provider.id} className="p-4 border rounded-md">
                        <p className="font-bold text-lg">{provider.name}</p>
                        <p><strong>Email:</strong> {provider.email}</p>
                        <p><strong>Teléfono:</strong> {provider.phone || 'N/A'}</p>
                        <p><strong>Ubicación:</strong> {[provider.city, provider.state, provider.country].filter(Boolean).join(', ')}</p>
                        <p><strong>Oficio:</strong> {provider.skill || 'N/A'}</p>
                        <p><strong>Categoría:</strong> {provider.category || 'N/A'}</p>
                        <p><strong>Tarifa:</strong> {provider.rate ? `$${provider.rate}` : 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Clients Column */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes ({clients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-4">
                    {clients.map(client => (
                      <div key={client.id} className="p-4 border rounded-md">
                        <p className="font-bold text-lg">{client.name}</p>
                        <p><strong>Email:</strong> {client.email}</p>
                        <p><strong>Teléfono:</strong> {client.phone || 'N/A'}</p>
                        <p><strong>Ubicación:</strong> {[client.city, client.state, client.country].filter(Boolean).join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;