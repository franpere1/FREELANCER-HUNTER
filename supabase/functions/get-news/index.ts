import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
    if (!NEWS_API_KEY) {
      throw new Error('El secreto NEWS_API_KEY no está configurado en Supabase.')
    }

    // Obtener el código de país de la cabecera de Supabase
    const locationHeader = req.headers.get('x-supabase-edge-location');
    let countryCode = 'us'; // Usar 'us' como predeterminado si no se encuentra la ubicación

    if (locationHeader) {
      const parts = locationHeader.split(', ');
      const countryPart = parts.find(part => part.startsWith('country='));
      if (countryPart) {
        countryCode = countryPart.split('=')[1].trim().toLowerCase();
      }
    }

    const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=${countryCode}&apiKey=${NEWS_API_KEY}`;
    
    const newsResponse = await fetch(newsApiUrl);
    if (!newsResponse.ok) {
      const errorData = await newsResponse.json();
      // NewsAPI puede no tener soporte para todos los países, devolvemos un array vacío en ese caso.
      if (errorData.code === 'countryInvalid') {
         return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      throw new Error(`Error de NewsAPI: ${errorData.message || newsResponse.statusText}`);
    }

    const newsData = await newsResponse.json();

    return new Response(JSON.stringify(newsData.articles), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})