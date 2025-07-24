import StockTable from "@/components/StockTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const stockData = [
    { name: "Bolsa de Valores de Caracas", symbol: "BVC", price: "N/A" },
    { name: "C.A. Conquistadora", symbol: "CQU.A", price: "N/A" },
    { name: "C.A. Fábrica Nacional de Cementos", symbol: "FNC", price: "N/A" },
    { name: "C.A. Ron Santa Teresa", symbol: "RST", price: "N/A" },
    { name: "C.A. Telares de Palo Grande", symbol: "TPG", price: "N/A" },
    { name: "CANTV", symbol: "TDV.D", price: "N/A" },
    { name: "Cerámica Carabobo", symbol: "CCR", price: "N/A" },
    { name: "Corimon", symbol: "CRM.A", price: "N/A" },
    { name: "Corporación Grupo Químico", symbol: "CGQ", price: "N/A" },
    { name: "Corporación Industrial de Energía", symbol: "ENR", price: "N/A" },
    { name: "Domínguez & Cía.", symbol: "DOM", price: "N/A" },
    { name: "Envases Venezolanos", symbol: "ENV", price: "N/A" },
    { name: "Fábrica de Productos Químicos", symbol: "FPQ", price: "N/A" },
    { name: "Fondo de Valores Inmobiliarios", symbol: "FVI.B", price: "N/A" },
    { name: "Grupo Zuliano", symbol: "GZL", price: "N/A" },
    { name: "Inmuebles y Valores Caracas", symbol: "IVC", price: "N/A" },
    { name: "Inversiones Diversas", symbol: "IDV", price: "N/A" },
    { name: "Jeantex", symbol: "JTX", price: "N/A" },
    { name: "Mampa", symbol: "MPA", price: "N/A" },
    { name: "Manapro", symbol: "MPR", price: "N/A" },
    { name: "Mercantil Servicios Financieros", symbol: "MVZ.A", price: "N/A" },
    { name: "Montesco", symbol: "MTC.A", price: "N/A" },
    { name: "Proagro", symbol: "PGR", price: "N/A" },
    { name: "Productos EFE", symbol: "EFE", price: "N/A" },
    { name: "Sivensa", symbol: "SVS", price: "N/A" },
    { name: "Venezolana de Pinturas", symbol: "VPI", price: "N/A" },
];

const StockPrices = () => {
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
              <span className="font-semibold text-orange-600">
                Nota: Estos datos son estáticos y no se actualizan en tiempo real.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockTable stocks={stockData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockPrices;