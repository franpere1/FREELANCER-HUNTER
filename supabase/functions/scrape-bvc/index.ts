import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const response = await fetch('https://www.bolsadecaracas.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al contactar la Bolsa de Valores: ${response.statusText}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
        throw new Error("No se pudo procesar la información de la página.");
    }

    // 1. Extraer los nombres de las empresas del menú desplegable
    const nameMap = new Map<string, string>();
    const options = doc.querySelectorAll('#symbol option');
    options.forEach(optionNode => {
        const option = optionNode as Element;
        const symbol = option.getAttribute('value');
        const name = option.textContent.trim();
        if (symbol && name && symbol !== "") {
            nameMap.set(symbol, name);
        }
    });

    // 2. Extraer los precios de la tabla principal
    const stockData: { name: string; symbol: string; price: string; }[] = [];
    const tableRows = doc.querySelectorAll('#myTable tbody tr');

    tableRows.forEach(rowNode => {
        const row = rowNode as Element;
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const symbol = cells[0].textContent.trim();
            const price = cells[1].textContent.trim();
            const name = nameMap.get(symbol) || 'Nombre no encontrado';

            if (symbol) {
                stockData.push({
                    symbol,
                    name,
                    price,
                });
            }
        }
    });

    return new Response(JSON.stringify(stockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})