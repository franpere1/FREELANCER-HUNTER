import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Star, Phone, Mail } from 'lucide-react';
import { ScrollArea } => '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import LatestProviders from '@/components/LatestProviders';
import BuyTokensDialog from '@/components/BuyTokensDialog';

interface UnlockedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile_image: string | null;
}

const Dashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [latestProviders, setLatestProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [isBuyTokensDialogOpen, setIsBuyTokensDialogOpen] = useState(false);
  const [unlockedClients, setUnlockedClients] = useState<UnlockedClient[]>([]);
  const [unlockedClientsLoading, setUnlockedClientsLoading] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    const fetchLatestProviders = async () => {
      if (profile && profile.type === 'client') {
        setProvidersLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, skill, rate, profile_image, star_rating')
          .eq('type', 'provider')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error("Error fetching latest providers:", error);
        } else {
          setLatestProviders(data || []);
        }
        setProvidersLoading(false);
      }
    };

    const fetchUnlockedClients = async () => {
      if (profile && profile.type === 'provider' && profile.id) {
        setUnlockedClientsLoading(true);
        const { data: unlockedData, error: unlockedError } = await supabase
          .from('unlocked_contacts')
          .select('client_id')
          .eq('provider_id', profile.id)
          .eq('feedback_submitted_for_this_unlock', false);

        if (unlockedError) {
          console.error("Error fetching unlocked contacts:", unlockedError);
          setUnlockedClients([]);
          setUnlockedClientsLoading(false);
          return;
        }

        const clientIds = unlockedData.map(item => item.client_id);

        if (clientIds.length > 0) {
          const { data: clientProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email, phone, profile_image')
            .in('id', clientIds);

          if (profilesError) {
            console.error("Error fetching client profiles:", profilesError);
            setUnlockedClients([]);
          } else {
            setUnlockedClients(clientProfiles || []);
          }
        } else {
          setUnlockedClients([]);
        }
        setUnlockedClientsLoading(false);
      }
    };

    fetchLatestProviders();
    fetchUnlockedClients();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        Cargando...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error al Cargar el Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>No pudimos encontrar los datos de tu perfil. Esto puede ocurrir si tu cuenta fue creada antes de que el sistema de perfiles estuviera activo.</p>
            <p>Por favor, intenta cerrar sesión y registrarte de nuevo.</p>
            <Button onClick={handleLogout}>Cerrar Sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="relative">
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                {profile.type === 'client' && (
                  <span className="text-blue-600 text-base font-semibold">
                    Tokens: {profile.token_balance !== null ? profile.token_balance : 0}
                  </span>
                )}
                <Button variant="outline" size="icon" onClick={() => navigate('/edit-profile')}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar Perfil</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.profile_image || undefined} alt={profile.name} />
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <CardTitle className="text-2xl">
                      <span>{profile.name}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    {profile.type === 'provider' && (
                      <div className="flex flex-col items-start mt-2">
                        <p className="text-sm font-semibold text-indigo-600">PROVEEDOR</p>
                        <div className="flex space-x-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                profile.star_rating && i < profile.star_rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {profile.type === 'provider' && (
                  <div className="flex flex-col items-start md:justify-self-end md:mt-0 mt-4">
                    <p className="font-semibold mb-2">Comentarios</p>
                    <ScrollArea className="h-32 w-full md:w-64 rounded-md border p-4">
                      {profile.feedback && profile.feedback.length > 0 ? (
                        profile.feedback.map((fb: any, index: number) => (
                          <div key={index} className="mb-2 pb-2 border-b last:border-b-0">
                            <p className="text-sm font-medium">{fb.comment}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(fb.timestamp).toLocaleDateString()} - {fb.type === 'positive' ? 'Positivo' : fb.type === 'negative' ? 'Negativo' : 'Neutral'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay comentarios aún.</p>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Tipo de Cuenta</p>
                  <p className="capitalize">
                    {profile.type}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Teléfono</p>
                  <p>{profile.phone}</p>
                </div>
                <div>
                  <p className="font-semibold">Ubicación</p>
                  <p>{profile.state}</p>
                </div>
              </div>
              {profile.type === 'provider' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Categoría de Servicio</p>
                      <p>{profile.category}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Oficio o Habilidad</p>
                      <p>{profile.skill}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Costo Aproximado del Servicio (BCV)</p>
                      <p>{profile.rate ? `${profile.rate}` : 'No especificado'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Descripción del Servicio</p>
                    <p className="text-muted-foreground">{profile.service_description}</p>
                  </div>
                  {profile.service_image && (
                    <div className="space-y-2">
                      <p className="font-semibold">Imagen del Servicio</p>
                      <img src={profile.service_image} alt="Servicio" className="rounded-lg max-w-sm border" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {profile.type === 'client' && (
            <Card className="md:col-span-1 flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Comprar Tokens</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center flex-grow">
                <p className="text-center text-muted-foreground mb-4">
                  Desbloquea contactos de proveedores con tokens.
                </p>
                <Button className="w-full" onClick={() => setIsBuyTokensDialogOpen(true)}>
                  Comprar Token
                </Button>
              </CardContent>
            </Card>
          )}

          {profile.type === 'provider' && (
            <Card className="md:col-span-1 flex flex-col">
              <CardHeader>
                <CardTitle>Solicitudes de Servicio</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                {unlockedClientsLoading ? (
                  <p>Cargando solicitudes...</p>
                ) : unlockedClients.length === 0 ? (
                  <p className="text-muted-foreground">Nadie ha desbloqueado tu contacto aún.</p>
                ) : (
                  <ScrollArea className="h-64 pr-4">
                    <div className="space-y-4">
                      {unlockedClients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-4 p-3 border rounded-md shadow-sm">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={client.profile_image || undefined} alt={client.name} />
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-lg">{client.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Phone className="h-4 w-4 mr-1" /> {client.phone}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Mail className="h-4 w-4 mr-1" /> {client.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {profile.type === 'client' && (
          <LatestProviders providers={latestProviders} isLoading={providersLoading} />
        )}
      </main>

      {profile.type === 'client' && (
        <BuyTokensDialog
          isOpen={isBuyTokensDialogOpen}
          onClose={() => setIsBuyTokensDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;