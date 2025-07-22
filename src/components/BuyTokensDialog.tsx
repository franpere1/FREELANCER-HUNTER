import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client'; // Corregido: de '=>' a 'from'
import { useAuth } from '@/context/AuthContext';

interface BuyTokensDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyTokensDialog: React.FC<BuyTokensDialogProps> = ({ isOpen, onClose }) => {
  const { user, refreshProfile } = useAuth();
  const [usdAmount, setUsdAmount] = useState<number | ''>('');
  const [tokensToReceive, setTokensToReceive] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setUsdAmount('');
      setTokensToReceive(0);
      setError(null);
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setUsdAmount('');
      setTokensToReceive(0);
      setError('Por favor, introduce un número válido.');
      return;
    }
    setUsdAmount(numValue);
    setTokensToReceive(numValue); // 1 USD = 1 Token
    if (numValue < 10) {
      setError('La compra mínima es de 10 USD (10 Tokens).');
    } else {
      setError(null);
    }
  };

  const handleBuyTokens = async () => {
    if (!user || usdAmount === '' || usdAmount < 10 || error) { // Asegurar que usdAmount no sea ''
      showError(String(error || 'Por favor, introduce un monto válido (mínimo 10 USD).'));
      return;
    }

    setIsProcessing(true);
    const toastId = showLoading('Procesando compra de tokens...');

    try {
      // Simular un pago exitoso
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (currentProfile?.token_balance || 0) + tokensToReceive;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ token_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      dismissToast(toastId);
      showSuccess(`¡Compra exitosa! Has recibido ${tokensToReceive} tokens.`);
      setUsdAmount('');
      setTokensToReceive(0);
      onClose();
    } catch (err: unknown) {
      dismissToast(toastId);
      console.error('Error al comprar tokens:', err);
      showError(err instanceof Error ? err.message : String(err || 'Error al procesar la compra: Inténtalo de nuevo.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comprar Tokens</DialogTitle>
          <DialogDescription>
            1 Token = 1 USD. Compra mínima: 10 Tokens.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="usdAmount" className="text-right">
              Monto en USD
            </Label>
            <Input
              id="usdAmount"
              type="number"
              step="0.01"
              min="10"
              value={usdAmount === '' ? '' : usdAmount.toString()} // Conversión explícita a string
              onChange={handleUsdChange}
              className="col-span-3"
              placeholder="Ej: 10.00"
              disabled={isProcessing}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tokens" className="text-right">
              Tokens a Recibir
            </Label>
            <Input
              id="tokens"
              value={tokensToReceive.toString()} // Conversión explícita a string
              readOnly
              className="col-span-3 bg-gray-100"
              disabled={isProcessing}
            />
          </div>
          <div className="text-center text-sm text-muted-foreground mt-2">
            Simulando pago con Binance Pay.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleBuyTokens} disabled={usdAmount === '' || usdAmount < 10 || !!error || isProcessing}>
            {isProcessing ? 'Procesando...' : `Comprar ${tokensToReceive > 0 ? `${tokensToReceive.toString()} Tokens` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyTokensDialog;