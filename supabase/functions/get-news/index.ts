import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      throw new Error('El secreto NEWS_API_KEY no está configurado en Supabase.')
    }

    const locationHeader = req.headers.get('x-supabase-edge-location');
    console.log(`[News Function] Received location header: ${locationHeader}`); // Log de diagnóstico

    let countryCode: string | null = null;

    if (locationHeader) {
      const parts = locationHeader.split(', ');
      const countryPart = parts.find(part => part.startsWith('country='));
      if (countryPart) {
        countryCode = countryPart.split('=')[1].trim().toLowerCase();
      }
    }

    // --- INICIO DE LA MODIFICACIÓN PARA PRUEBAS ---
    // Si no se detecta un código de país (común en entornos de desarrollo),
    // forzamos uno para demostrar la funcionalidad.
    if (!countryCode) {
      countryCode = 'jp'; // Forzamos Japón para la prueba
      console.log(`[News Function] No location detected. FORCING country code to: ${countryCode} for testing.`);
    }
    // --- FIN DE LA MODIFICACIÓN PARA PRUEBAS ---
    
    console.log(`[News Function] Determined country code: ${countryCode}`); // Log de diagnóstico

    let newsApiUrl = `https://newsapi.org/v2/top-headlines?apiKey=${NEWS_API_KEY}`;

    if (countryCode && supportedCountries.has(countryCode)) {
      newsApiUrl += `&country=${countryCode}`;
      console.log(`[News Function] Fetching news for country: ${countryCode}`); // Log de diagnóstico
    } else {
      newsApiUrl += `&category=general`;
      console.log(`[News Function] Falling back to general news.`); // Log de diagnóstico
    }
    
    const newsResponse = await fetch(newsApiUrl);
    
    if (!newsResponse.ok) {
      const errorData = await newsResponse.json();
      throw new Error(`Error de NewsAPI: ${errorData.message || newsResponse.statusText}`);
    }

    const newsData = await newsResponse.json();
    const DEEPL_API_KEY = Deno.env.get('DEEPL_API_KEY');

    if (!DEEPL_API_KEY || !newsData.articles || newsData.articles.length === 0) {
      return new Response(JSON.stringify(newsData.articles || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const textsToTranslate: string[] = [];
    newsData.articles.forEach((article: any) => {
      textsToTranslate.push(article.title || '');
      textsToTranslate.push(article.description || '');
    });

    const deeplResponse = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textsToTranslate,
        target_lang: 'ES',
      }),
    });

    if (!deeplResponse.ok) {
      console.error('DeepL API error:', await deeplResponse.text());
      return new Response(JSON.stringify(newsData.articles), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const deeplData = await deeplResponse.json();
    const translations = deeplData.translations.map((t: any) => t.text);

    const translatedArticles = newsData.articles.map((article: any, index: number) => ({
      ...article,
      title: translations[index * 2],
      description: translations[index * 2 + 1],
    }));

    return new Response(JSON.stringify(translatedArticles), {
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