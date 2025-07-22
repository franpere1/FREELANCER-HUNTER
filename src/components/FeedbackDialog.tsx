import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

const feedbackSchema = z.object({
  feedbackType: z.enum(['positive', 'negative', 'neutral'], {
    required_error: 'Por favor, selecciona un tipo de feedback.',
  }),
  comment: z.string().max(500, { message: 'El comentario no puede exceder los 500 caracteres.' }).optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  clientId: string;
  onFeedbackSubmitted: () => void; // Callback para refrescar los datos del proveedor
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose, providerId, clientId, onFeedbackSubmitted }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
  });

  const handleSelectChange = (value: string) => {
    setValue('feedbackType', value as 'positive' | 'negative' | 'neutral', { shouldValidate: true });
  };

  const onSubmit = async (data: FeedbackFormData) => {
    const toastId = showLoading('Enviando calificación...');
    try {
      const { error } = await supabase.rpc('add_feedback', {
        provider_id_in: providerId,
        client_id_in: clientId,
        feedback_type_in: data.feedbackType,
        comment_in: data.comment || '', // Asegurarse de enviar una cadena vacía si no hay comentario
      });

      if (error) {
        throw error;
      }

      dismissToast(toastId);
      showSuccess('¡Calificación enviada con éxito!');
      onFeedbackSubmitted(); // Refrescar los datos del proveedor
      onClose();
      reset(); // Limpiar el formulario
    } catch (err: any) {
      dismissToast(toastId);
      console.error('Error al enviar calificación:', err);
      showError(err.message || 'Ocurrió un error al enviar la calificación.');
    }
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Calificar Proveedor</DialogTitle>
          <DialogDescription>
            Comparte tu experiencia con este proveedor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feedbackType">Tipo de Feedback</Label>
            <Select onValueChange={handleSelectChange}>
              <SelectTrigger id="feedbackType">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
            {errors.feedbackType && <p className="text-red-500 text-xs mt-1">{errors.feedbackType.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment">Comentario (Opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Escribe tu comentario aquí..."
              {...register('comment')}
              rows={4}
            />
            {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;