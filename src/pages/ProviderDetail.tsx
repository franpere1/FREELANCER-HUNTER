import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Phone, Mail } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import FeedbackDialog from '@/components/FeedbackDialog';

interface ProviderProfile {
  id: string;
  name: string;
  email: string;
  state: string;
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

const ProviderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: clientProfile, loading: authLoading, refreshProfile } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContactVisible, setIsContactVisible] = useState(false);
  const [feedbackSubmittedForCurrentUnlock, setFeedbackSubmittedForCurrentUnlock] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const fetchProviderAndUnlockStatus = useCallback(async () => {
    if (!id) {
      showError('ID de proveedor no encontrado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching provider:", error);
      showError('Error al cargar la información del proveedor.');
      setProvider(null);
      setIsContactVisible(false);
      setFeedbackSubmittedForCurrentUnlock(false);
    } else {
      setProvider(data);
      let unlockedFromDB = false;
      let feedbackSubmitted = false;

      if (clientProfile && clientProfile.type === 'client' && user) {
        const { data: unlockedData, error: unlockedError } = await supabase
          .from('unlocked_contacts')
          .select('id, feedback_submitted_for_this_unlock')
          .eq('client_id', user.id)
          .eq('provider_id', id)
          .single();

        if (!unlockedError && unlockedData) {
          unlockedFromDB = true;
          feedbackSubmitted = unlockedData.feedback_submitted_for_this_unlock;
        }
      }

      setIsContactVisible(unlockedFromDB && !feedbackSubmitted); 
      setFeedbackSubmittedForCurrentUnlock(feedbackSubmitted);
    }
    setLoading(false);
  }, [id, user, clientProfile]);

  useEffect(() => {
    fetchProviderAndUnlockStatus();
  }, [fetchProviderAndUnlockStatus]);

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
  };

  const handleUnlockContact = async () => {
    if (!user || !clientProfile || clientProfile.type !== 'client') {
      showError('Debes ser un cliente para desbloquear contactos.');
      return;
    }
    if (!id) {
      showError('ID de proveedor no encontrado.');
      return;
    }

    const toastId = showLoading('Desbloqueando información de contacto...');

    try {
      const { data, error } = await supabase.rpc('unlock_provider_contact', { provider_id_in: id });

      if (error) {
        throw error;
      }

      if (data === 'DESBLOQUEO EXITOSO') {
        await refreshProfile();
        await fetchProviderAndUnlockStatus(); 
        dismissToast(toastId);
        showSuccess('¡Información de contacto desbloqueada con éxito!');
      } else if (data === 'CONTACTO YA DESBLOQUEADO') {
        await refreshProfile();
        await fetchProviderAndUnlockStatus();
        dismissToast(toastId);
        showSuccess('La información de contacto ya está desbloqueada.');
      } else {
        throw new Error('Respuesta inesperada del servidor.');
      }
    } catch (err: unknown) {
      dismissToast(toastId);
      console.error('Error al desbloquear contacto:', err);
      showError(err instanceof Error ? err.message : String(err || 'Ocurrió un error al desbloquear la información.'));
    }
  };

  const handleFeedbackSubmitted = () => {
    setIsFeedbackDialogOpen(false);
    fetchProviderAndUnlockStatus();
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        Cargando información del proveedor...
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Proveedor No Encontrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>No se pudo encontrar el proveedor con el ID proporcionado.</p>
            <Button onClick={() => navigate('/dashboard')}>Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClient = clientProfile?.type === 'client';
  const showBlurred = isClient && !isContactVisible; 
  const canUnlock = isClient && !isContactVisible; 
  const canGiveFeedback = isClient && isContactVisible && !feedbackSubmittedForCurrentUnlock; 

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          Volver
        </Button>
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="relative">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={provider.profile_image || undefined} alt={provider.name} />
                <AvatarFallback className="text-4xl">{getInitials(provider.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-3xl">{provider.name}</CardTitle>
                <CardDescription className="text-lg text-indigo-600 font-semibold">
                  {provider.skill || 'Proveedor de Servicios'}
                </CardDescription>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        provider.star_rating && i < provider.star_rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  )}
                  {provider.rate && <span className="ml-3 text-lg text-gray-700">~ ${provider.rate} BCV</span>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
              <div>
                <p className="font-semibold text-gray-700">Ubicación</p>
                <p>{provider.state}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Categoría de Servicio</p>
                <p>{provider.category || 'No especificado'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-gray-600" />
                <p className="font-semibold text-gray-700">Teléfono:</p>
                <p className={cn(showBlurred && 'blur-sm select-none')}>
                  {provider.phone}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-600" />
                <p className="font-semibold text-gray-700">Correo:</p>
                <p className={cn(showBlurred && 'blur-sm select-none')}>
                  {provider.email}
                </p>
              </div>
            </div>

            {canUnlock && (
              <div className="text-center pt-4 border-t">
                <Button onClick={handleUnlockContact} className="w-full md:w-auto">
                  Liberar información de contacto (1 Token)
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Tu saldo actual: {clientProfile?.token_balance?.toString() || '0'} Tokens
                </p>
              </div>
            )}

            {canGiveFeedback && (
              <div className="text-center pt-4 border-t">
                <Button onClick={() => setIsFeedbackDialogOpen(true)} className="w-full md:w-auto">
                  Calificar Proveedor
                </Button>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t">
              <p className="font-semibold text-gray-700">Descripción del Servicio</p>
              <p className="text-muted-foreground leading-relaxed">{provider.service_description || 'No hay descripción de servicio disponible.'}</p>
            </div>

            {provider.service_image && (
              <div className="space-y-2">
                <p className="font-semibold text-gray-700">Imagen del Servicio</p>
                <img src={provider.service_image} alt="Servicio" className="rounded-lg max-w-md border shadow-sm" />
              </div>
            )}

            <div className="space-y-2 pt-4 border-t">
              <p className="font-semibold text-gray-700">Comentarios de Clientes</p>
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-gray-50">
                {provider.feedback && provider.feedback.length > 0 ? (
                  provider.feedback.map((fb: any, index: number) => (
                    <div key={index} className="mb-3 pb-3 border-b last:border-b-0">
                      <p className="text-sm font-medium">{fb.comment}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fb.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay comentarios aún para este proveedor.</p>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </main>

      {isClient && user && (
        <FeedbackDialog
          isOpen={isFeedbackDialogOpen}
          onClose={() => setIsFeedbackDialogOpen(false)}
          providerId={provider.id}
          clientId={user.id}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  );
};

export default ProviderDetail;