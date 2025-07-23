import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { session, isPasswordRecovery, logout } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPasswordRecovery) {
        showError("Enlace de recuperación inválido o expirado.");
        navigate('/login');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isPasswordRecovery, navigate]);

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    if (!isPasswordRecovery || !session) {
      showError("No autorizado para restablecer la contraseña.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.');
      await logout();
      navigate('/login');
    }
  };

  if (!isPasswordRecovery) {
    return <div className="flex items-center justify-center min-h-screen">Verificando enlace...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle>Restablecer Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;