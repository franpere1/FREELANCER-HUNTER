import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState, useCallback } from 'react';
import LatestProviders from '@/components/LatestProviders';
import BuyTokensDialog from '@/components/BuyTokensDialog';
import FeedbackDialog from '@/components/FeedbackDialog';
import { showSuccess, showError } from '@/utils/toast';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { Input } from '@/components/ui/input';

const Dashboard = () => {
  const { profile, loading, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  
  const [latestProviders, setLatestProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [isBuyTokensDialogOpen, setIsBuyTokensDialogOpen] = useState(false);
  const [activeContacts, setActiveContacts] = useState<any[]>([]);
  const [activeContactsLoading, setActiveContactsLoading] = useState(true);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedProviderForFeedback, setSelectedProviderForFeedback] = useState<any>(null);
  const [requestingClients, setRequestingClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchClientData = useCallback(async () => {
    if (!profile || !user) return;
    setActiveContactsLoading(true);
    try {
      const { data: unlockedData, error: unlockedError } = await supabase
        .from('unlocked_contacts')
        .select('provider_id, feedback_submitted_for_this_unlock')
        .eq('client_id', profile.id)
        .eq('feedback_submitted_for_this_unlock', false);

      if (unlockedError) throw unlockedError;

      if (unlockedData && unlockedData.length > 0) {
        const providerIds = unlockedData.map(uc => uc.provider_id);
        
        const [profilesResult, unreadResult] = await Promise.all([
          supabase.from('profiles').select('id, name, skill, rate, profile_image, star_rating').in('id', providerIds),
          supabase.from('messages').select('sender_id').eq('receiver_id', user.id).in('sender_id', providerIds).not('read_by', 'cs', `{${user.id}}`)
        ]);

        const { data: providers, error: providersError } = profilesResult;
        const { data: unreadData, error: unreadError } = unreadResult;

        if (providersError) throw providersError;
        if (unreadError) throw unreadError;

        const unreadSenders = new Set(unreadData?.map(msg => msg.sender_id) || []);
        const contactsWithStatus = providers?.map(p => ({
          ...p,
          feedback_submitted: unlockedData.find(ud => ud.provider_id === p.id)?.feedback_submitted_for_this_unlock,
          hasUnreadMessages: unreadSenders.has(p.id),
        }));
        setActiveContacts(contactsWithStatus || []);
      } else {
        setActiveContacts([]);
      }
    } catch (error) {
      console.error("Error fetching active contacts:", error);
      setActiveContacts([]);
    } finally {
      setActiveContactsLoading(false);
    }
  }, [profile, user]);

  const fetchProviderData = useCallback(async () => {
    if (!profile || !user) return;
    setClientsLoading(true);
    try {
      const { data: unlockedData, error: unlockedError } = await supabase
        .from('unlocked_contacts')
        .select('client_id')
        .eq('provider_id', profile.id)
        .eq('feedback_submitted_for_this_unlock', false);

      if (unlockedError) throw unlockedError;

      if (unlockedData && unlockedData.length > 0) {
        const clientIds = unlockedData.map(uc => uc.client_id);

        const [clientsResult, unreadResult] = await Promise.all([
          supabase.from('profiles').select('id, name, phone, email, profile_image').in('id', clientIds),
          supabase.from('messages').select('sender_id').eq('receiver_id', user.id).in('sender_id', clientIds).not('read_by', 'cs', `{${user.id}}`)
        ]);

        const { data: clientsData, error: clientsError } = clientsResult;
        const { data: unreadData, error: unreadError } = unreadResult;

        if (clientsError) throw clientsError;
        if (unreadError) throw unreadError;

        const unreadSenders = new Set(unreadData?.map(msg => msg.sender_id) || []);
        const clientsWithStatus = clientsData?.map(c => ({
          ...c,
          hasUnreadMessages: unreadSenders.has(c.id),
        }));
        setRequestingClients(clientsWithStatus || []);
      } else {
        setRequestingClients([]);
      }
    } catch (error) {
      console.error("Error fetching requesting clients:", error);
      setRequestingClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, [profile, user]);

  const fetchLatestProvidersForClient = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const { data: providersData, error: providersError } = await supabase
          .from('profiles')
          .select('id, name, skill, rate, profile_image, star_rating')
          .eq('type', 'provider')
          .order('created_at', { ascending: false })
          .limit(10);
      if (providersError) throw providersError;
      setLatestProviders(providersData || []);
    } catch (error) {
      console.error("Error fetching latest providers:", error);
      setLatestProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
    fetchLatestProvidersForClient();
  }, [fetchLatestProvidersForClient]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setProvidersLoading(true);
    try {
      const { data: providersData, error: providersError } = await supabase
        .from('profiles')
        .select('id, name, skill, rate, profile_image, star_rating')
        .eq('type', 'provider')
        .or(`name.ilike.%${trimmedSearch}%,skill.ilike.%${trimmedSearch}%,service_description.ilike.%${trimmedSearch}%`)
        .limit(20);

      if (providersError) throw providersError;
      setLatestProviders(providersData || []);
    } catch (error) {
      console.error("Error searching providers:", error);
      showError('Ocurrió un error al buscar proveedores.');
      setLatestProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !profile) {
      return;
    }

    if (profile.type === 'client') {
      fetchClientData();
      fetchLatestProvidersForClient();
    } else if (profile.type === 'provider') {
      fetchProviderData();
    } else {
      // Handle cases with no or unknown profile type
      setActiveContactsLoading(false);
      setProvidersLoading(false);
      setClientsLoading(false);
    }
  }, [loading, profile, refetchTrigger, fetchClientData, fetchProviderData, fetchLatestProvidersForClient]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Error al Cargar el Perfil</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p>No pudimos encontrar los datos de tu perfil. Por favor, intenta cerrar sesión y registrarte de nuevo.</p>
            <Button onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}>Cerrar Sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('') : '';

  const handleBuyTokensDialogClose = () => {
    setIsBuyTokensDialogOpen(false);
    refreshProfile();
  };

  const handleFeedbackSubmitted = () => {
    setIsFeedbackDialogOpen(false);
    setSelectedProviderForFeedback(null);
    setRefetchTrigger(t => t + 1);
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
                  <Edit className="h-4 w-4" /><span className="sr-only">Editar Perfil</span>
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
                          <Star key={i} className={`h-5 w-5 ${profile.star_rating && i < profile.star_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
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
                <div><p className="font-semibold text-gray-600">Tipo de Cuenta</p><p className="capitalize">{profile.type === 'client' ? 'Cliente' : 'Proveedor'}</p></div>
                <div><p className="font-semibold text-gray-600">Teléfono</p><p>{profile.phone}</p></div>
                <div><p className="font-semibold text-gray-600">Ubicación</p><p>{profile.state}</p></div>
              </div>
              {profile.type === 'provider' && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Información de Proveedor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><p className="font-semibold text-gray-600">Categoría</p><p>{profile.category || 'No especificado'}</p></div>
                    <div><p className="font-semibold text-gray-600">Oficio/Habilidad</p><p>{profile.skill || 'No especificado'}</p></div>
                    <div><p className="font-semibold text-gray-600">Costo estimado del servicio</p><p>{profile.rate ? `$${profile.rate}` : 'No especificado'}</p></div>
                  </div>
                  <div><p className="font-semibold text-gray-600">Descripción del Servicio</p><p className="text-muted-foreground">{profile.service_description || 'No disponible'}</p></div>
                  {profile.service_image && <div className="space-y-2"><p className="font-semibold text-gray-600">Imagen del Servicio</p><img src={profile.service_image} alt="Servicio" className="rounded-lg max-w-sm border shadow-sm" /></div>}
                </div>
              )}
            </CardContent>
          </Card>

          {profile.type === 'client' ? (
            <Card className="flex flex-col"><CardHeader><CardTitle>Comprar Tokens</CardTitle></CardHeader><CardContent className="flex flex-col items-center justify-center flex-grow text-center"><p className="text-muted-foreground mb-4">Desbloquea contactos de proveedores y accede a más funciones.</p><Button className="w-full" onClick={() => setIsBuyTokensDialogOpen(true)}>Comprar Tokens</Button></CardContent></Card>
          ) : (
            <Card><CardHeader><CardTitle>Comentarios Recientes</CardTitle></CardHeader><CardContent><ScrollArea className="h-64 pr-4">{profile.feedback && profile.feedback.length > 0 ? [...profile.feedback].reverse().map((fb: any) => <div key={fb.id} className="mb-3 pb-3 border-b last:border-b-0"><p className="text-sm font-medium">{fb.comment}</p><p className="text-xs text-muted-foreground">{new Date(fb.timestamp).toLocaleDateString()} - <span className={fb.type === 'positive' ? 'text-green-600' : 'text-red-600'}>{fb.type}</span></p></div>) : <p className="text-sm text-muted-foreground text-center py-8">No tienes comentarios aún.</p>}</ScrollArea></CardContent></Card>
          )}
        </div>

        {profile.type === 'client' && (
          <>
            <div className="mt-8">
              <Card>
                <CardHeader><CardTitle>Contactos Activos</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 pr-4">
                    {activeContactsLoading ? <p className="text-sm text-muted-foreground text-center py-8">Cargando contactos...</p> : activeContacts.length > 0 ? (
                      <div className="space-y-4">
                        {activeContacts.map((provider) => (
                          <div key={provider.id} className="flex items-center justify-between p-4 border rounded-md shadow-sm">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12"><AvatarImage src={provider.profile_image || undefined} alt={provider.name} /><AvatarFallback>{getInitials(provider.name)}</AvatarFallback></Avatar>
                              <div>
                                <p className="font-semibold text-lg">{provider.name}</p>
                                <p className="text-sm text-muted-foreground">{provider.skill || 'Sin oficio'}</p>
                                <div className="flex items-center mt-1">
                                  {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${provider.star_rating && i < provider.star_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}
                                </div>
                                {provider.rate && <p className="text-sm text-gray-600 mt-1">Costo estimado del servicio: ${provider.rate}</p>}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button variant="outline" size="sm" asChild><Link to={`/provider/${provider.id}`}>Ver</Link></Button>
                              {provider.hasUnreadMessages ? (
                                <Button size="sm" asChild className="bg-green-500 hover:bg-green-600 text-white animate-pulse">
                                  <Link to={`/chat/${provider.id}`} state={{ otherUser: provider }}>Mensaje Nuevo</Link>
                                </Button>
                              ) : (
                                <Button size="sm" asChild>
                                  <Link to={`/chat/${provider.id}`} state={{ otherUser: provider }}>Chatear</Link>
                                </Button>
                              )}
                              {!provider.feedback_submitted && <Button size="sm" onClick={() => { setSelectedProviderForFeedback(provider); setIsFeedbackDialogOpen(true); }}>Calificar</Button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground text-center py-8">No tienes contactos activos. ¡Desbloquea uno para empezar!</p>}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Proveedores</CardTitle>
                  <CardDescription>Encuentra profesionales por nombre, oficio o palabras clave.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Ej: Plomero, electricista, diseño web..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-grow"
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button type="submit" className="w-full">Buscar</Button>
                      {isSearching && (
                        <Button type="button" variant="outline" onClick={clearSearch} className="w-full">Limpiar</Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isSearching ? `Resultados para "${searchTerm}"` : 'Últimos Proveedores Registrados'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LatestProviders 
                    providers={latestProviders} 
                    isLoading={providersLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {profile.type === 'provider' && (
          <div className="mt-8">
            <Card><CardHeader><CardTitle>Clientes Solicitando Servicio</CardTitle></CardHeader><CardContent><ScrollArea className="h-64 pr-4">{clientsLoading ? <p className="text-sm text-muted-foreground text-center py-8">Cargando clientes...</p> : requestingClients.length > 0 ? requestingClients.map((client: any) => <div key={client.id} className="flex items-center justify-between mb-3 pb-3 border-b last:border-b-0"><div><p className="text-sm font-semibold">{client.name}</p><p className="text-xs text-muted-foreground">Tel: {client.phone}</p><p className="text-xs text-muted-foreground">Correo: {client.email}</p></div>
            {client.hasUnreadMessages ? (
              <Button size="sm" asChild className="bg-green-500 hover:bg-green-600 text-white animate-pulse">
                <Link to={`/chat/${client.id}`} state={{ otherUser: client }}>Mensaje Nuevo</Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to={`/chat/${client.id}`} state={{ otherUser: client }}>Chatear</Link>
              </Button>
            )}
            </div>) : <p className="text-sm text-muted-foreground text-center py-8">Nadie ha solicitado tu servicio aún.</p>}</ScrollArea></CardContent></Card>
          </div>
        )}
      </main>

      {profile.type === 'client' && <BuyTokensDialog isOpen={isBuyTokensDialogOpen} onClose={handleBuyTokensDialogClose} />}
      
      {profile.type === 'client' && selectedProviderForFeedback && (
        <FeedbackDialog
          isOpen={isFeedbackDialogOpen}
          onClose={() => setIsFeedbackDialogOpen(false)}
          providerId={selectedProviderForFeedback.id}
          clientId={profile.id}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  );
};

export default Dashboard;