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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUp, ThumbsDown, MinusCircle, CheckCircle } from 'lucide-react';

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
  onFeedbackSubmitted: () => void;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose, providerId, clientId, onFeedbackSubmitted }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset, watch } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
  });

  const selectedFeedbackType = watch('feedbackType');

  const handleFeedbackTypeChange = (value: string) => {
    setValue('feedbackType', value as 'positive' | 'negative' | 'neutral', { shouldValidate: true });
  };

  const onSubmit = async (data: FeedbackFormData) => {
    const toastId = showLoading('Enviando calificación...');
    try {
      const { error } = await supabase.rpc('add_feedback', {
        provider_id_in: providerId,
        client_id_in: clientId,
        feedback_type_in: data.feedbackType,
        comment_in: data.comment || '',
      });

      if (error) {
        throw error;
      }

      dismissToast(toastId);
      showSuccess('¡Calificación enviada con éxito!');
      onFeedbackSubmitted();
      onClose();
      reset();
    } catch (err: unknown) {
      dismissToast(toastId);
      console.error('Error al enviar calificación:', err);
      showError(err instanceof Error ? err.message : String(err || 'Ocurrió un error al enviar la calificación.'));
    }
  };

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
            <ToggleGroup
              type="single"
              value={selectedFeedbackType ?? ''} // Ajuste aquí
              onValueChange={handleFeedbackTypeChange}
              className="flex justify-center space-x-4"
              disabled={isSubmitting}
            >
              <ToggleGroupItem value="positive" aria-label="Feedback Positivo" className="flex flex-col items-center p-4 h-auto w-28">
                <ThumbsUp className="h-8 w-8 text-green-500" />
                <span className="mt-2 text-sm">Positivo</span>
                {selectedFeedbackType === 'positive' && <CheckCircle className="h-4 w-4 text-blue-500 mt-1" />}
              </ToggleGroupItem>
              <ToggleGroupItem value="neutral" aria-label="Feedback Neutral" className="flex flex-col items-center p-4 h-auto w-28">
                <MinusCircle className="h-8 w-8 text-gray-500" />
                <span className="mt-2 text-sm">Neutral</span>
                {selectedFeedbackType === 'neutral' && <CheckCircle className="h-4 w-4 text-blue-500 mt-1" />}
              </ToggleGroupItem>
              <ToggleGroupItem value="negative" aria-label="Feedback Negativo" className="flex flex-col items-center p-4 h-auto w-28">
                <ThumbsDown className="h-8 w-8 text-red-500" />
                <span className="mt-2 text-sm">Negativo</span>
                {selectedFeedbackType === 'negative' && <CheckCircle className="h-4 w-4 text-blue-500 mt-1" />}
              </ToggleGroupItem>
            </ToggleGroup>
            {errors.feedbackType && <p className="text-red-500 text-xs mt-1 text-center">{errors.feedbackType.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment">Comentario (Opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Escribe tu comentario aquí..."
              {...register('comment')}
              rows={4}
              disabled={isSubmitting}
            />
            {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedFeedbackType}>
              {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;