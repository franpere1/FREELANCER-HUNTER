import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Trash2, Globe, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { countries } from '@/lib/location-data';

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

interface VisitLog {
  id: number;
  created_at: string;
  country: string | null;
  user_id: string | null;
  profiles: { name: string } | null;
}

const adminPasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'La contraseña actual es requerida.' }),
  newPassword: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmNewPassword"],
});

type AdminPasswordFormData = z.infer<typeof adminPasswordSchema>;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProviders, setFilteredProviders] = useState<Profile[]>([]);
  const [filteredClients, setFilteredClients] = useState<Profile[]>([]);
  const [visitCount, setVisitCount] = useState(0);
  const [lastVisits, setLastVisits] = useState<VisitLog[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  const countryMap = new Map(countries.map(c => [c.code, c.name]));

  const getCountryName = (code: string | null | undefined): string => {
    if (!code || code === 'Unknown') return 'Desconocido';
    return countryMap.get(code) || code;
  };

  const { 
    register: registerPassword, 
    handleSubmit: handlePasswordSubmit, 
    formState: { errors: passwordErrors, isSubmitting },
    reset: resetPasswordForm 
  } = useForm<AdminPasswordFormData>({
    resolver: zodResolver(adminPasswordSchema),
  });

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setVisitsLoading(true);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, country, state, city, type, category, skill, rate');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else if (profilesData) {
        const allProviders = profilesData.filter(p => p.type === 'provider');
        const allClients = profilesData.filter(p => p.type === 'client');
        setProviders(allProviders);
        setClients(allClients);
        setFilteredProviders(allProviders);
        setFilteredClients(allClients);
      }
      setLoading(false);

      // Fetch visit stats
      const { count, error: countError } = await supabase
        .from('visit_logs')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching visit count:', countError);
      } else {
        setVisitCount(count || 0);
      }

      // Fetch last 10 visits from registered users
      const { data: visitsData, error: visitsError } = await supabase
        .from('visit_logs')
        .select('id, created_at, country, user_id')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (visitsError) {
        console.error('Error fetching last visits:', visitsError);
        setLastVisits([]);
      } else if (visitsData) {
        const userIds = visitsData
          .map(v => v.user_id)
          .filter((id): id is string => id !== null && id !== undefined);

        let profilesMap = new Map<string, { name: string }>();
        if (userIds.length > 0) {
          const { data: profilesDataForVisits, error: profilesErrorForVisits } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          if (profilesErrorForVisits) {
            console.error('Error fetching profiles for visits:', profilesErrorForVisits);
          } else if (profilesDataForVisits) {
            profilesMap = new Map(profilesDataForVisits.map(p => [p.id, { name: p.name }]));
          }
        }

        const combinedData = visitsData.map(visit => ({
          ...visit,
          profiles: visit.user_id ? profilesMap.get(visit.user_id) || null : null,
        }));
        
        setLastVisits(combinedData as VisitLog[]);
      }
      
      setVisitsLoading(false);
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    const filteredP = providers.filter(p => {
      return (
        p.name.toLowerCase().includes(lowercasedFilter) ||
        p.email.toLowerCase().includes(lowercasedFilter) ||
        (p.phone && p.phone.toLowerCase().includes(lowercasedFilter)) ||
        (p.country && p.country.toLowerCase().includes(lowercasedFilter)) ||
        (p.state && p.state.toLowerCase().includes(lowercasedFilter)) ||
        (p.city && p.city.toLowerCase().includes(lowercasedFilter)) ||
        (p.skill && p.skill.toLowerCase().includes(lowercasedFilter)) ||
        (p.category && p.category.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredProviders(filteredP);
  
    const filteredC = clients.filter(c => {
      return (
        c.name.toLowerCase().includes(lowercasedFilter) ||
        c.email.toLowerCase().includes(lowercasedFilter) ||
        (c.phone && c.phone.toLowerCase().includes(lowercasedFilter)) ||
        (c.country && c.country.toLowerCase().includes(lowercasedFilter)) ||
        (c.state && c.state.toLowerCase().includes(lowercasedFilter)) ||
        (c.city && c.city.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredClients(filteredC);
  
  }, [searchTerm, providers, clients]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  const onPasswordChangeSubmit = async (data: AdminPasswordFormData) => {
    const toastId = showLoading('Actualizando contraseña...');
    try {
      const { data: settings, error: fetchError } = await supabase
        .from('settings')
        .select('id, admin_password')
        .limit(1)
        .single();

      if (fetchError || !settings) {
        throw new Error('No se pudo obtener la configuración del administrador.');
      }

      if (data.currentPassword !== settings.admin_password) {
        throw new Error('La contraseña actual es incorrecta.');
      }

      const { error: updateError } = await supabase
        .from('settings')
        .update({ admin_password: data.newPassword })
        .eq('id', settings.id);

      if (updateError) {
        throw updateError;
      }

      dismissToast(toastId);
      showSuccess('¡Contraseña de administrador actualizada con éxito!');
      resetPasswordForm();

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'No se pudo actualizar la contraseña.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const toastId = showLoading(`Borrando usuario ${userToDelete.name}...`);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userToDelete.id },
      });
      if (error) throw error;
      dismissToast(toastId);
      showSuccess('Usuario borrado con éxito.');
      if (userToDelete.type === 'provider') {
        setProviders(prev => prev.filter(p => p.id !== userToDelete.id));
      } else {
        setClients(prev => prev.filter(c => c.id !== userToDelete.id));
      }
      setUserToDelete(null);
    } catch (error: any) {
      dismissToast(toastId);
      console.error('Error deleting user:', error);
      showError(error.message || 'No se pudo borrar el usuario.');
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">Panel de Administrador</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5" /><span className="sr-only">Cerrar Sesión</span></Button>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <Card className="mb-8">
          <CardHeader><CardTitle>Estadísticas de Visitas</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Visitas Totales</h3>
              {visitsLoading ? (
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-5xl font-bold text-indigo-600">{visitCount}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Últimas Visitas de Usuarios Registrados</h3>
              {visitsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />)}
                </div>
              ) : (
                <ScrollArea className="h-48">
                  <ul className="space-y-3">
                    {lastVisits.map(visit => (
                      <li key={visit.id} className="flex items-center justify-between text-sm pb-2 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium">
                            {visit.profiles ? visit.profiles.name : 'Anónimo'}
                            <span className="text-gray-600 font-normal ml-1">({getCountryName(visit.country)})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(visit.created_at).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>Cambiar Contraseña de Administrador</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordChangeSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input id="currentPassword" type="password" {...registerPassword('currentPassword')} />
                {passwordErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input id="newPassword" type="password" {...registerPassword('newPassword')} placeholder="Mínimo 6 caracteres" />
                {passwordErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                <Input id="confirmNewPassword" type="password" {...registerPassword('confirmNewPassword')} />
                {passwordErrors.confirmNewPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmNewPassword.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Contraseña'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>Buscar Usuarios</CardTitle></CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Buscar por nombre, email, oficio, ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {loading ? <p>Cargando datos...</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Proveedores ({filteredProviders.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {filteredProviders.map(provider => (
                      <div key={provider.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{provider.name}</p>
                            <p><strong>Email:</strong> {provider.email}</p>
                            <p><strong>Teléfono:</strong> {provider.phone || 'N/A'}</p>
                            <p><strong>Ubicación:</strong> {[provider.city, provider.state, provider.country].filter(Boolean).join(', ')}</p>
                            <p><strong>Oficio:</strong> {provider.skill || 'N/A'}</p>
                            <p><strong>Categoría:</strong> {provider.category || 'N/A'}</p>
                            <p><strong>Tarifa:</strong> {provider.rate ? `$${provider.rate}` : 'N/A'}</p>
                          </div>
                          <Button variant="destructive" size="icon" onClick={() => setUserToDelete(provider)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Clientes ({filteredClients.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {filteredClients.map(client => (
                      <div key={client.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{client.name}</p>
                            <p><strong>Email:</strong> {client.email}</p>
                            <p><strong>Teléfono:</strong> {client.phone || 'N/A'}</p>
                            <p><strong>Ubicación:</strong> {[client.city, client.state, client.country].filter(Boolean).join(', ')}</p>
                          </div>
                          <Button variant="destructive" size="icon" onClick={() => setUserToDelete(client)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se borrará permanentemente el usuario <span className="font-bold">{userToDelete?.name}</span> y todos sus datos asociados (perfil, mensajes, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">Sí, borrar usuario</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;