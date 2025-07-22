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
import { useNavigate } from 'react-router-dom';

interface BuyTokensDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyTokensDialog: React.FC<BuyTokensDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [usdAmount, setUsdAmount] = useState<number | ''>('');
  const [tokensToReceive, setTokensToReceive] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

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

  const handleProceedToPayment = () => {
    if (usdAmount === '' || usdAmount < 10 || error) {
      // This should ideally not be triggerable due to button disabled state, but as a safeguard.
      return;
    }
    onClose(); // Close the dialog
    navigate(`/payment?amount=${usdAmount}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comprar Tokens</DialogTitle>
          <DialogDescription>
            1 Token = 1 USD. Compra mínima: 10 Tokens. Serás redirigido a nuestra pasarela de pago segura.
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
              value={String(usdAmount)}
              onChange={handleUsdChange}
              className="col-span-3"
              placeholder="Ej: 10.00"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tokens" className="text-right">
              Tokens a Recibir
            </Label>
            <Input
              id="tokens"
              value={String(tokensToReceive)}
              readOnly
              className="col-span-3 bg-gray-100"
            />
          </div>
          <div className="text-center text-sm text-muted-foreground mt-2">
            Simulando pago con Binance Pay.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleProceedToPayment} disabled={usdAmount === '' || usdAmount < 10 || !!error}>
            Proceder al Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyTokensDialog;