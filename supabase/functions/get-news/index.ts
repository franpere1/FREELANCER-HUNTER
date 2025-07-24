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

    // Se ha eliminado la detección de ubicación para obtener siempre noticias generales.
    const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=general&apiKey=${NEWS_API_KEY}`;
    console.log(`[News Function] Fetching general news.`);
    
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