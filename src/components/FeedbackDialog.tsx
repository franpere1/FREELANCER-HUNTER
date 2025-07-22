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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { showError, showLoading, dismissToast } from '@/utils/toast';

const feedbackSchema = z.object({
  feedbackType: z.enum(['positive', 'negative', 'neutral'], {
    required_error: 'Por favor, selecciona un tipo de comentario.',
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

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  providerId,
  clientId,
  onFeedbackSubmitted,
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackType: undefined,
      comment: '',
    },
  });

  const watchedFeedbackType = watch('feedbackType');

  const onSubmit = async (data: FeedbackFormData) => {
    const toastId = showLoading('Enviando comentario...');
    try {
      const { error } = await supabase.rpc('add_feedback', {
        provider_id_in: providerId,
        client_id_in: clientId,
        feedback_type_in: data.feedbackType,
        comment_in: data.comment || '', // Ensure comment is a string
      });

      if (error) {
        throw error;
      }

      dismissToast(toastId);
      onFeedbackSubmitted(); // Callback to update parent state and re-fetch data
      reset(); // Reset form fields
      onClose(); // Close the dialog
    } catch (err: unknown) {
      dismissToast(toastId);
      console.error('Error al enviar comentario:', err);
      showError(err instanceof Error ? err.message : String(err || 'Error al enviar el comentario.'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dejar Comentario</DialogTitle>
          <DialogDescription>
            Ayúdanos a mejorar la comunidad dejando un comentario sobre tu experiencia con este proveedor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Comentario</Label>
            <RadioGroup
              onValueChange={(value: 'positive' | 'negative' | 'neutral') => setValue('feedbackType', value, { shouldValidate: true })}
              value={watchedFeedbackType}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="positive" id="positive" />
                <Label htmlFor="positive">Positivo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="neutral" />
                <Label htmlFor="neutral">Neutral</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="negative" id="negative" />
                <Label htmlFor="negative">Negativo</Label>
              </div>
            </RadioGroup>
            {errors.feedbackType && <p className="text-red-500 text-xs mt-1">{errors.feedbackType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (Opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Comparte tu experiencia..."
              {...register('comment')}
              className="min-h-[80px]"
            />
            {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment.message}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !watchedFeedbackType}>
              {isSubmitting ? 'Enviando...' : 'Enviar Comentario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;