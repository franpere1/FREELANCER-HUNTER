import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const onSubmit = async ({ email, password }: LoginFormData) => { // Desestructuración para asegurar tipos no opcionales
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
    } else {
      showSuccess('¡Inicio de sesión exitoso!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full">Iniciar Sesión</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            ¿No tienes una cuenta?{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;