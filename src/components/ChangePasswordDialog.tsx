import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { showError, showLoading, dismissToast, showSuccess } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'La contraseña actual es requerida.' }),
  newPassword: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmNewPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    if (!user?.email) {
      showError("No se pudo encontrar tu correo electrónico.");
      return;
    }

    const toastId = showLoading('Verificando contraseña actual...');

    // Paso 1: Verificar la contraseña actual intentando iniciar sesión con ella.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    });

    if (signInError) {
      dismissToast(toastId);
      showError('La contraseña actual es incorrecta.');
      return;
    }

    // Paso 2: Si la verificación es exitosa, actualizar a la nueva contraseña.
    dismissToast(toastId);
    const updateToastId = showLoading('Actualizando a la nueva contraseña...');
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    dismissToast(updateToastId);

    if (updateError) {
      showError(updateError.message || 'Error al actualizar la contraseña.');
    } else {
      showSuccess('¡Contraseña actualizada con éxito!');
      reset();
      onClose();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y la nueva contraseña para actualizarla.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <Input id="currentPassword" type="password" {...register('currentPassword')} />
            {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
            <Input id="confirmNewPassword" type="password" {...register('confirmNewPassword')} />
            {errors.confirmNewPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword.message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;