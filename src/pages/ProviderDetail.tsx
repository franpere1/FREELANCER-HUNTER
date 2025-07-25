import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import FeedbackDialog from '@/components/FeedbackDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProviderProfile {
  id: string;
  name: string;
  email: string;
  country: string | null;
  state: string | null;
  city: string | null;
  phone: string;
  type: 'client' | 'provider';
  category: string | null;
  skill: string | null;
  service_description: string | null;
  profile_image: string | null;
  star_rating: number | null;
  service_image: string | null;
  rate: number | null;
  feedback: any[] | null;
}

interface UnlockedContact {
  id: number;
  client_id: string;
  provider_id: string;
  last_unlocked_at: string;
  feedback_submitted_for_this_unlock: boolean;
}

interface RequestingClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  profile_image: string | null;
  hasUnreadMessages?: boolean;
}

const ProviderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile: clientProfile, user, loading: authLoading, refreshProfile } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContactUnlocked, setIsContactUnlocked] = useState(false);
  const [unlockedContactRecord, setUnlockedContactRecord] = useState<UnlockedContact | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [requestingClients, setRequestingClients] = useState<RequestingClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data: providerData, error: providerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (providerError) {
          console.error("Error fetching provider:", providerError);
          showError('Error al cargar la información del proveedor.');
          setProvider(null);
          return;
        }
        setProvider(providerData);

        if (user.id === providerData.id) {
          setClientsLoading(true);
          const { data: unlockedData, error: unlockedError } = await supabase
            .from('unlocked_contacts')
            .select('client_id')
            .eq('provider_id', providerData.id)
            .eq('feedback_submitted_for_this_unlock', false);

          if (!unlockedError && unlockedData && unlockedData.length > 0) {
            const clientIds = unlockedData.map(uc => uc.client_id);
            const { data: clientsData, error: clientsError } = await supabase
              .from('profiles')
              .select('id, name, phone, email, profile_image')
              .in('id', clientIds);
            
            const { data: unreadData } = await supabase
              .from('messages')
              .select('sender_id')
              .eq('receiver_id', user.id)
              .in('sender_id', clientIds)
              .not('read_by', 'cs', `{${user.id}}`);
              
            const unreadSenders = new Set(unreadData?.map(msg => msg.sender_id) || []);

            if (clientsError || !clientsData) {
              setRequestingClients([]);
            } else {
              const clientsWithStatus = clientsData.map(c => ({
                ...c,
                hasUnreadMessages: unreadSenders.has(c.id),
              }));
              setRequestingClients(clientsWithStatus);
            }
          } else {
            setRequestingClients([]);
          }
          setClientsLoading(false);
        } else if (clientProfile && clientProfile.type === 'client') {
          const { data: unlockedContacts, error: unlockedError } = await supabase
            .from('unlocked_contacts')
            .select('*')
            .eq('client_id', user.id)
            .eq('provider_id', id)
            .eq('feedback_submitted_for_this_unlock', false)
            .order('last_unlocked_at', { ascending: false });

          if (unlockedContacts && unlockedContacts.length > 0 && !unlockedError) {
            setUnlockedContactRecord(unlockedContacts[0]);
            setIsContactUnlocked(true);
          } else {
            setUnlockedContactRecord(null);
            setIsContactUnlocked(false);
          }
        }
      } catch (error) {
        console.error("An unexpected error occurred in fetchDetails:", error);
        showError("Ocurrió un error inesperado al cargar los detalles.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchDetails();
    }
  }, [id, authLoading, user, clientProfile, refetchTrigger]);

  const handleUnlockContact = async () => {
    if (!user || clientProfile?.type !== 'client' || !id) {
      showError('Debes ser un cliente para desbloquear contactos.');
      return;
    }
    if ((clientProfile.token_balance || 0) < 1) {
      showError('No tienes suficientes tokens para desbloquear este contacto.');
      return;
    }
    const toastId = showLoading('Desbloqueando contacto...');
    try {
      const { data: result, error: unlockError } = await supabase.rpc('unlock_provider_contact', { provider_id_in: id });
      if (unlockError) throw unlockError;

      setIsContactUnlocked(true);
      dismissToast(toastId);
      
      if (typeof result === 'string' && result.startsWith('CONTACTO YA DESBLOQUEADO')) {
        showError(result);
      } else {
        showSuccess('¡Contacto desbloqueado con éxito! Ahora puedes chatear con el proveedor.');
      }

      await refreshProfile();
      setRefetchTrigger(t => t + 1);
    } catch (err: any) {
      dismissToast(toastId);
      console.error('Error al desbloquear contacto:', err);
      
      const errorMessage = err.message || 'Error al desbloquear el contacto. Inténtalo de nuevo.';
      showError(errorMessage);
      
      setIsContactUnlocked(false);
    }
  };

  const handleFeedbackSubmitted = async () => {
    setIsFeedbackDialogOpen(false);
    showSuccess('¡Gracias por tu comentario!');
    await refreshProfile();
    setRefetchTrigger(t => t + 1);
  };

  if (loading || authLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando...</div>;
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Proveedor No Encontrado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p>No se pudo encontrar el proveedor con el ID proporcionado.</p>
            <Button onClick={() => navigate('/dashboard')}>Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClient = clientProfile?.type === 'client';
  const canShowFeedbackButton = isContactUnlocked && unlockedContactRecord && !unlockedContactRecord.feedback_submitted_for_this_unlock;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">Volver</Button>
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="relative">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24"><AvatarImage src={provider.profile_image || undefined} alt={provider.name} /><AvatarFallback className="text-4xl">{getInitials(provider.name)}</AvatarFallback></Avatar>
              <div>
                <CardTitle className="text-3xl">{provider.name}</CardTitle>
                <CardDescription className="text-lg text-indigo-600 font-semibold">{provider.skill || 'Proveedor de Servicios'}</CardDescription>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`h-5 w-5 ${provider.star_rating && i < provider.star_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}
                </div>
                {provider.rate && <p className="mt-2 text-lg text-gray-700">Costo estimado del servicio: ${provider.rate}</p>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
              <div><p className="font-semibold text-gray-700">Ubicación</p><p>{[provider.city, provider.state, provider.country].filter(Boolean).join(', ')}</p></div>
              <div><p className="font-semibold text-gray-700">Categoría de Servicio</p><p>{provider.category || 'No especificado'}</p></div>
              <div><p className="font-semibold text-gray-700">Teléfono:</p><p className={isClient && !isContactUnlocked ? 'blur-sm' : ''}>{provider.phone}</p></div>
              <div><p className="font-semibold text-gray-700">Correo:</p><p className={isClient && !isContactUnlocked ? 'blur-sm' : ''}>{provider.email}</p></div>
            </div>
            {isClient && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                {!isContactUnlocked ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button className="w-full sm:w-auto" disabled={(clientProfile?.token_balance || 0) < 1}>Mostrar Contacto (1 Token)</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>¿Confirmar Desbloqueo?</AlertDialogTitle><AlertDialogDescription>Estás a punto de usar 1 token para ver la información de contacto de este proveedor. Esta acción no se puede deshacer. ¿Deseas continuar?</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleUnlockContact}>Confirmar y Desbloquear</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button asChild className="w-full sm:w-auto"><Link to={`/chat/${provider.id}`} state={{ otherUser: provider }}>Ir al Chat</Link></Button>
                )}
                {canShowFeedbackButton && <Button variant="secondary" onClick={() => setIsFeedbackDialogOpen(true)} className="w-full sm:w-auto">Calificar</Button>}
              </div>
            )}
            <div className="space-y-2 pt-4 border-t"><p className="font-semibold text-gray-700">Descripción del Servicio</p><p className="text-muted-foreground leading-relaxed">{provider.service_description || 'No hay descripción de servicio disponible.'}</p></div>
            {provider.service_image && <div className="space-y-2"><p className="font-semibold text-gray-700">Imagen del Servicio</p><img src={provider.service_image} alt="Servicio" className="rounded-lg max-w-md border shadow-sm" /></div>}
            <div className="space-y-2 pt-4 border-t">
              <p className="font-semibold text-gray-700">Últimos 3 Comentarios</p>
              <div className="space-y-4">
                {provider.feedback && provider.feedback.length > 0 ? (
                  [...provider.feedback]
                    .reverse()
                    .slice(0, 3)
                    .map((fb: any) => (
                      <div key={fb.id} className="p-3 rounded-md border bg-gray-50">
                        <div className="flex items-center mb-1">
                          {fb.type === 'positive' && <ThumbsUp className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />}
                          {fb.type === 'negative' && <ThumbsDown className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />}
                          {fb.type === 'neutral' && <Meh className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />}
                          <p className="text-sm font-semibold capitalize">
                            {fb.type === 'positive' && 'Positivo'}
                            {fb.type === 'negative' && 'Negativo'}
                            {fb.type === 'neutral' && 'Neutral'}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">{fb.comment || 'El cliente no dejó un comentario escrito.'}</p>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">{new Date(fb.timestamp).toLocaleDateString()}</p>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay comentarios aún para este proveedor.
                  </p>
                )}
              </div>
            </div>
            {user && provider && user.id === provider.id && (
              <div className="space-y-2 pt-4 border-t">
                <p className="font-semibold text-gray-700">Clientes solicitando servicio</p>
                <ScrollArea className="h-48 w-full rounded-md border p-4 bg-gray-50">
                  {clientsLoading ? <p className="text-sm text-muted-foreground text-center py-8">Cargando clientes...</p> : requestingClients.length > 0 ? requestingClients.map((client) => <div key={client.id} className="flex items-center justify-between mb-3 pb-3 border-b last:border-b-0"><div><p className="text-sm font-semibold">{client.name}</p><p className="text-xs text-muted-foreground">Tel: {client.phone}</p><p className="text-xs text-muted-foreground">Correo: {client.email}</p></div>
                  {client.hasUnreadMessages ? (
                    <Button asChild size="sm" className="bg-green-500 hover:bg-green-600 text-white animate-pulse">
                      <Link to={`/chat/${client.id}`} state={{ otherUser: client }}>Mensaje Nuevo</Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link to={`/chat/${client.id}`} state={{ otherUser: client }}>Chatear</Link>
                    </Button>
                  )}
                  </div>) : <p className="text-sm text-muted-foreground text-center py-8">Nadie ha solicitado tu servicio aún.</p>}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      {isClient && user && provider && <FeedbackDialog isOpen={isFeedbackDialogOpen} onClose={() => setIsFeedbackDialogOpen(false)} providerId={provider.id} clientId={user.id} onFeedbackSubmitted={handleFeedbackSubmitted} />}
    </div>
  );
};

export default ProviderDetail;