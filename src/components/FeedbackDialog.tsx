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
import { showError, showLoading, dismissToast, showSuccess } from '@/utils/toast';
import { ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const onSubmit = (data: FeedbackFormData) => {
    const toastId = showLoading('Enviando tu comentario...');

    // Fire-and-forget the RPC call to not block the UI
    supabase.rpc('add_feedback', {
      provider_id_in: providerId,
      client_id_in: clientId,
      feedback_type_in: data.feedbackType,
      comment_in: data.comment || '',
    }).then(({ error }) => {
      dismissToast(toastId);
      if (error) {
        console.error('Error al enviar comentario:', error);
        showError(error.message || 'Error al enviar el comentario.');
      } else {
        showSuccess('¡Gracias por tu comentario! La conversación ha sido cerrada.');
        onFeedbackSubmitted(); // Callback to update parent state (e.g., re-fetch data)
      }
    });

    // Close the dialog immediately for a faster perceived experience
    reset();
    onClose();
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
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="positive" id="positive" className="sr-only" />
                <Label
                  htmlFor="positive"
                  className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-green-50 hover:border-green-400",
                    watchedFeedbackType === 'positive' ? "border-green-500 bg-green-100 text-green-900" : "border-gray-200"
                  )}
                >
                  <ThumbsUp className="h-8 w-8 mb-2" />
                  <span className="font-medium text-sm">Positivo</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="neutral" id="neutral" className="sr-only" />
                <Label
                  htmlFor="neutral"
                  className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-yellow-50 hover:border-yellow-400",
                    watchedFeedbackType === 'neutral' ? "border-yellow-500 bg-yellow-100 text-yellow-900" : "border-gray-200"
                  )}
                >
                  <Meh className="h-8 w-8 mb-2" />
                  <span className="font-medium text-sm">Neutral</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="negative" id="negative" className="sr-only" />
                <Label
                  htmlFor="negative"
                  className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-red-50 hover:border-red-400",
                    watchedFeedbackType === 'negative' ? "border-red-500 bg-red-100 text-red-900" : "border-gray-200"
                  )}
                >
                  <ThumbsDown className="h-8 w-8 mb-2" />
                  <span className="font-medium text-sm">Negativo</span>
                </Label>
              </div>
            </RadioGroup>
            {errors.feedbackType && <p className="text-red-500 text-xs mt-1 text-center">{errors.feedbackType.message}</p>}
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