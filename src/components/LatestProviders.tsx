import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

interface ProviderSummary {
  id: string;
  name: string;
  skill: string | null;
  rate: number | null;
  profile_image: string | null;
  star_rating: number | null;
}

interface LatestProvidersProps {
  providers: ProviderSummary[];
  isLoading: boolean;
}

const getInitials = (name: string) => {
  if (!name) return '';
  return name.split(' ').map((n) => n[0]).join('');
};

const LatestProviders: React.FC<LatestProvidersProps> = ({ providers, isLoading }) => {
  const navigate = useNavigate(); // Inicializar useNavigate

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Últimos Proveedores Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando proveedores...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Últimos Proveedores Registrados</CardTitle>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <p className="text-muted-foreground">No hay proveedores registrados aún.</p>
        ) : (
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-4 border rounded-md shadow-sm">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={provider.profile_image || undefined} alt={provider.name} />
                      <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">{provider.skill || 'Sin oficio'}</p>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              provider.star_rating && i < provider.star_rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        {provider.rate && <span className="ml-2 text-sm text-gray-600">~ ${provider.rate} BCV</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/provider/${provider.id}`)}> {/* Navegar a la página de detalles */}
                    Ver
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestProviders;