import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showError } from '@/utils/toast';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') === 'true') {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async ({ email, password }: LoginFormData) => {
    if (email.trim() !== 'admin@admin.com') {
      showError('Credenciales de administrador inválidas.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('admin_password')
        .limit(1)
        .single();

      if (error || !data) {
        console.error('Error fetching admin password:', error);
        showError('No se pudo verificar la contraseña. Contacte al soporte.');
        return;
      }

      if (password === data.admin_password) {
        sessionStorage.setItem('isAdmin', 'true');
        navigate('/admin/dashboard');
      } else {
        showError('Credenciales de administrador inválidas.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showError('Ocurrió un error inesperado.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card className="w-[400px] bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle>Acceso de Administrador</CardTitle>
          <CardDescription className="text-gray-400">Ingresa tus credenciales de administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" {...register('email')} className="bg-gray-700 border-gray-600 text-white" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register('password')} className="bg-gray-700 border-gray-600 text-white" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Iniciar Sesión</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;