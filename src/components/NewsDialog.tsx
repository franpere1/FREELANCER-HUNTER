import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2, Newspaper } from 'lucide-react';

interface Article {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  source: {
    name: string;
  };
  publishedAt: string;
}

interface NewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewsDialog: React.FC<NewsDialogProps> = ({ isOpen, onClose }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchNews = async () => {
        setLoading(true);
        setError(null);
        setArticles([]);
        try {
          const { data, error: functionError } = await supabase.functions.invoke('get-news');
          
          if (functionError) {
            throw functionError;
          }
          
          if (data.error) {
             throw new Error(data.error);
          }

          setArticles(data);
        } catch (err: any) {
          console.error("Error fetching news:", err);
          const errorMessage = err.message || 'No se pudieron cargar las noticias. Inténtalo de nuevo más tarde.';
          setError(errorMessage);
          showError(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      fetchNews();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Newspaper className="h-6 w-6" />
            Noticias de tu Región
          </DialogTitle>
          <DialogDescription>
            Últimos titulares de tu región. Si no podemos detectar tu ubicación o no es soportada, te mostraremos noticias generales del mundo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full text-red-500">
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {articles.length > 0 ? articles.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {article.urlToImage && (
                    <img src={article.urlToImage} alt={article.title} className="w-full h-40 object-cover rounded-md mb-3" />
                  )}
                  <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{article.source.name}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </a>
              )) : (
                <p className="text-center text-gray-500 py-10">No se encontraron noticias para tu región.</p>
              )}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewsDialog;