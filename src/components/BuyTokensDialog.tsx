import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BuyTokensDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyTokensDialog: React.FC<BuyTokensDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comprar Tokens</DialogTitle>
          <DialogDescription className="text-center pt-4 text-base">
            ¡Próximamente! Estamos trabajando para traer la mejor pasarela de pagos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyTokensDialog;