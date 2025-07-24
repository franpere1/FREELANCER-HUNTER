import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lista de códigos de país soportados por NewsAPI para una validación rápida
const supportedCountries = new Set([
  'ae', 'ar', 'at', 'au', 'be', 'bg', 'br', 'ca', 'ch', 'cn', 'co', 'cu', 'cz', 'de', 'eg', 'fr', 'gb', 'gr', 'hk', 'hu', 'id', 'ie', 'il', 'in', 'it', 'jp', 'kr', 'lt', 'lv', 'ma', 'mx', 'my', 'ng', 'nl', 'no', 'nz', 'ph', 'pl', 'pt', 'ro', 'rs', 'ru', 'sa', 'se', 'sg', 'si', 'sk', 'th', 'tr', 'tw', 'ua', 'us', 've', 'za'
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
    if (!NEWS_API_KEY) {
      // Este es un error común si el secreto no está configurado.
      throw new Error('El secreto NEWS_API_KEY no está configurado en Supabase. Por favor, configúralo en el panel de tu proyecto.')
    }

    const locationHeader = req.headers.get('x-supabase-edge-location');
    let countryCode: string | null = null;

    if (locationHeader) {
      const parts = locationHeader.split(', ');
      const countryPart = parts.find(part => part.startsWith('country='));
      if (countryPart) {
        countryCode = countryPart.split('=')[1].trim().toLowerCase();
      }
    }

    let newsApiUrl = `https://newsapi.org/v2/top-headlines?apiKey=${NEWS_API_KEY}`;

    // Si el país detectado es válido y soportado, lo usamos.
    if (countryCode && supportedCountries.has(countryCode)) {
      newsApiUrl += `&country=${countryCode}`;
    } else {
      // Si no, recurrimos a la categoría 'general' para noticias mundiales.
      newsApiUrl += `&category=general`;
    }
    
    const newsResponse = await fetch(newsApiUrl);
    
    if (!newsResponse.ok) {
      const errorData = await newsResponse.json();
      // Lanzamos un error detallado de la API de noticias
      throw new Error(`Error de NewsAPI: ${errorData.message || newsResponse.statusText}`);
    }

    const newsData = await newsResponse.json();

    return new Response(JSON.stringify(newsData.articles), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Devolvemos el error en la respuesta para facilitar la depuración
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})