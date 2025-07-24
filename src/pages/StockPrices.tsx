import { useEffect, useState } from "react";
import StockTable from "@/components/StockTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  name: string;
  symbol: string;
  price: string;
}

const StockPrices = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockPrices = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: functionError } = await supabase.functions.invoke('scrape-bvc');
        
        if (functionError) {
          throw functionError;
        }

        if (!Array.isArray(data)) {
            throw new Error("La respuesta del servidor no fue la esperada.");
        }

        setStocks(data);
      } catch (err: any) {
        console.error("Error fetching stock prices:", err);
        setError(err.message || "No se pudieron cargar los precios de las acciones. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchStockPrices();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <p className="text-lg">Cargando datos de la Bolsa de Valores...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-600 bg-red-50 p-8 rounded-lg">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Ocurrió un error</p>
          <p className="text-center">{error}</p>
        </div>
      );
    }

    return <StockTable stocks={stocks} />;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="container mx-auto">
        <Button asChild variant="outline" className="mb-4">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Precios de Acciones - BVC</CardTitle>
            <CardDescription>
              Valores de referencia de la Bolsa de Valores de Caracas.
              <br />
              <span className="text-sm text-gray-500">
                Última actualización: {new Date().toLocaleString()}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockPrices;