import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Trash2 } from 'lucide-react';
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
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsSaving(true);
    const toastId = showLoading('Guardando nueva contraseña...');
    try {
      const { data: settings, error: fetchError } = await supabase.from('settings').select('id').limit(1).single();
      if (fetchError || !settings) throw new Error('No se pudo encontrar la configuración para actualizar.');
      const { error: updateError } = await supabase.from('settings').update({ admin_password: newPassword }).eq('id', settings.id);
      if (updateError) throw updateError;
      dismissToast(toastId);
      showSuccess('¡Contraseña actualizada con éxito!');
      setNewPassword('');
    } catch (error: any) {
      dismissToast(toastId);
      console.error('Error updating password:', error);
      showError(error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setIsSaving(false);
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
          <CardHeader><CardTitle>Cambiar Contraseña de Administrador</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Introduce la nueva contraseña (mín. 6 caracteres)" />
              </div>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Contraseña'}</Button>
            </form>
          </CardContent>
        </Card>

        {loading ? <p>Cargando datos...</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Proveedores ({providers.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-4">
                    {providers.map(provider => (
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
              <CardHeader><CardTitle>Clientes ({clients.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-4">
                    {clients.map(client => (
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