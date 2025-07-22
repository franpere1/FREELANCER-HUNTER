import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';

const SimulatedBinancePay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [amount, setAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const usdAmount = searchParams.get('amount');
    if (usdAmount) {
      const numAmount = parseFloat(usdAmount);
      if (!isNaN(numAmount) && numAmount >= 10) {
        setAmount(numAmount);
      } else {
        showError('Monto inválido o menor al mínimo de 10 USD.');
        navigate('/dashboard');
      }
    } else {
      showError('No se especificó un monto para el pago.');
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const handleConfirmPayment = async () => {
    if (!user || !profile || amount === null) {
      showError('Error de sesión o monto inválido.');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (currentProfile?.token_balance || 0) + amount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ token_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      if (isMounted.current) {
        setIsSuccess(true);
        showSuccess(`¡Pago exitoso! Has recibido ${amount} tokens.`);
        
        setTimeout(() => {
          if (isMounted.current) {
            navigate('/dashboard');
          }
        }, 2000);
      }

    } catch (err: unknown) {
      console.error('Error al procesar el pago:', err);
      showError(err instanceof Error ? err.message : String(err || 'Error al procesar el pago.'));
      if (isMounted.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (amount === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/Binance_Logo.png" alt="Binance Logo" className="h-8 mr-2" />
            <span className="text-2xl font-bold text-yellow-400">Pay</span>
          </div>
          <CardTitle className="text-xl">Confirmar Pago</CardTitle>
          <CardDescription className="text-gray-400">
            Estás a punto de pagar con tu cuenta de Binance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
            <span className="text-gray-300">Monto a Pagar:</span>
            <span className="text-2xl font-bold text-yellow-400">{amount.toFixed(2)} USD</span>
          </div>
          <div className="text-center text-gray-400 text-sm">
            <p>Comercio: <span className="font-semibold text-white">FREELANCER HUNTER</span></p>
            <p>Desde: <span className="font-semibold text-white">{profile?.email}</span></p>
          </div>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center text-center p-6">
              {isSuccess ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <p className="text-lg font-semibold">¡Pago Completado!</p>
                  <p className="text-gray-400">Serás redirigido en un momento.</p>
                </>
              ) : (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-yellow-400 mb-4" />
                  <p className="text-lg font-semibold">Procesando Pago...</p>
                  <p className="text-gray-400">Por favor, no cierres esta ventana.</p>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
              <span>Transacción segura y encriptada.</span>
            </div>
          )}
        </CardContent>
        {!isProcessing && (
          <CardFooter className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleCancel} className="bg-gray-600 hover:bg-gray-500 border-gray-500">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
              Confirmar Pago
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default SimulatedBinancePay;