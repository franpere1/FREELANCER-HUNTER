import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    const resetPasswordUrl = `${window.location.origin}/#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetPasswordUrl,
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.');
      navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>Ingresa tu correo electrónico para recibir un enlace de recuperación.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Volver a Iniciar Sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;