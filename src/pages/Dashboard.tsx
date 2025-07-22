import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import LatestProviders from '@/components/LatestProviders';
import BuyTokensDialog from '@/components/BuyTokensDialog';

const Dashboard = () => {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [latestProviders, setLatestProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [isBuyTokensDialogOpen, setIsBuyTokensDialogOpen] = useState(false);
  const [requestingClients, setRequestingClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

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
          .limit(5);

        if (error) {
          console.error("Error fetching latest providers:", error);
        } else {
          setLatestProviders(data || []);
        }
        setProvidersLoading(false);
      }
    };

    const fetchRequestingClients = async () => {
      if (profile && profile.type === 'provider') {
        setClientsLoading(true);
        const { data: unlockedData, error: unlockedError } = await supabase
          .from('unlocked_contacts')
          .select('client_id')
          .eq('provider_id', profile.id);

        if (unlockedError) {
          console.error("Error fetching unlocked contacts:", unlockedError);
          setRequestingClients([]);
        } else {
          const clientIds = unlockedData.map(uc => uc.client_id);
          if (clientIds.length > 0) {
            const { data: clientsData, error: clientsError } = await supabase
              .from('profiles')
              .select('id, name, phone, email')
              .in('id', clientIds);

            if (clientsError) {
              console.error("Error fetching client profiles:", clientsError);
              setRequestingClients([]);
            } else {
              setRequestingClients(clientsData || []);
            }
          } else {
            setRequestingClients([]);
          }
        }
        setClientsLoading(false);
      }
    };

    fetchLatestProviders();
    fetchRequestingClients();
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
            <p>No pudimos encontrar los datos de tu perfil. Por favor, intenta cerrar sesión y registrarte de nuevo.</p>
            <Button onClick={handleLogout}>Cerrar Sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
  };

  const handleDialogClose = () => {
    setIsBuyTokensDialogOpen(false);
    refreshProfile();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader className="relative">
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                {profile.type === 'client' && (
                  <span className="text-blue-600 text-base font-semibold bg-blue-100 px-3 py-1 rounded-full">
                    Tokens: {profile.token_balance ?? '0'}
                  </span>
                )}
                <Button variant="outline" size="icon" onClick={() => navigate('/edit-profile')}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar Perfil</span>
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.profile_image || undefined} alt={profile.name} />
                  <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl">{profile.name}</CardTitle>
                  <p className="text-base text-muted-foreground">{profile.email}</p>
                  {profile.type === 'provider' && (
                    <div className="flex items-center mt-2">
                      <div className="flex space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              profile.star_rating && i < profile.star_rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">({profile.feedback?.length ?? 0} reseñas)</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-600">Tipo de Cuenta</p>
                  <p className="capitalize">{profile.type === 'client' ? 'Cliente' : 'Proveedor'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Teléfono</p>
                  <p>{profile.phone}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Ubicación</p>
                  <p>{profile.state}</p>
                </div>
              </div>
              {profile.type === 'provider' && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Información de Proveedor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-600">Categoría</p>
                      <p>{profile.category || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">Oficio/Habilidad</p>
                      <p>{profile.skill || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">Costo Aproximado (BCV)</p>
                      <p>{profile.rate ? `$${profile.rate}` : 'No especificado'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Descripción del Servicio</p>
                    <p className="text-muted-foreground">{profile.service_description || 'No disponible'}</p>
                  </div>
                  {profile.service_image && (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-600">Imagen del Servicio</p>
                      <img src={profile.service_image} alt="Servicio" className="rounded-lg max-w-sm border shadow-sm" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {profile.type === 'client' ? (
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Comprar Tokens</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center flex-grow text-center">
                <p className="text-muted-foreground mb-4">
                  Desbloquea contactos de proveedores y accede a más funciones.
                </p>
                <Button className="w-full" onClick={() => setIsBuyTokensDialogOpen(true)}>
                  Comprar Tokens
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Comentarios Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 pr-4">
                  {profile.feedback && profile.feedback.length > 0 ? (
                    profile.feedback.map((fb: any, index: number) => (
                      <div key={index} className="mb-3 pb-3 border-b last:border-b-0">
                        <p className="text-sm font-medium">{fb.comment}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(fb.timestamp).toLocaleDateString()} - <span className={fb.type === 'positive' ? 'text-green-600' : 'text-red-600'}>{fb.type}</span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No tienes comentarios aún.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {profile.type === 'client' && (
          <div className="mt-8">
            <LatestProviders providers={latestProviders} isLoading={providersLoading} />
          </div>
        )}

        {profile.type === 'provider' && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Solicitando Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 pr-4">
                  {clientsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Cargando clientes...</p>
                  ) : requestingClients.length > 0 ? (
                    requestingClients.map((client: any) => (
                      <div key={client.id} className="mb-3 pb-3 border-b last:border-b-0">
                        <p className="text-sm font-semibold">{client.name}</p>
                        <p className="text-xs text-muted-foreground">Tel: {client.phone}</p>
                        <p className="text-xs text-muted-foreground">Correo: {client.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nadie ha solicitado tu servicio aún.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {profile.type === 'client' && (
        <BuyTokensDialog
          isOpen={isBuyTokensDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </div>
  );
};

export default Dashboard;