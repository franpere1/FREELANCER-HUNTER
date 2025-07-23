import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar la solicitud preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Usar la clave de servicio para tener permisos de escritura
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener el user_id del cuerpo de la solicitud (si existe)
    const { user_id } = await req.json().catch(() => ({ user_id: null }));
    
    // Supabase Edge Runtime provee el país del IP en esta cabecera
    const country = req.headers.get('x-vercel-ip-country') ?? 'Unknown';

    // Insertar el registro de la visita
    const { error } = await supabaseAdmin.from('visit_logs').insert({
      country: country,
      user_id: user_id,
    })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ message: 'Visit logged successfully' }), {
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