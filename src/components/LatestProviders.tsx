import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (isLoading) {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-md shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
  }

  if (providers.length === 0) {
    return (
        <p className="text-muted-foreground text-center py-8">
            No hay proveedores registrados aún.
        </p>
    );
  }

  return (
    <ScrollArea className="h-72 pr-4">
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
                </div>
                {provider.rate && <p className="text-sm text-gray-600 mt-1">Costo estimado del servicio: ${provider.rate}</p>}
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(`/provider/${provider.id}`)}>
              Ver
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default LatestProviders;