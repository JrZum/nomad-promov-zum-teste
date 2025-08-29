
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://database-supabase.7hatw3.easypanel.host',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
    );
    
    const { token } = await req.json();
    
    if (!token) {
      console.error("Token não fornecido na requisição");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Token não fornecido' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Verificando validade do token:", token.substring(0, 5) + "...");
    
    // Using explicit parameters with Supabase RPC
    // @ts-ignore - The parameter name is now 'input_token' in the Supabase function
    const { data, error } = await supabaseClient.rpc('verify_admin', {
      input_token: token
    });

    if (error) {
      console.error("Erro ao verificar token:", error.message);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Resposta da verificação:", data);

    return new Response(JSON.stringify({ valid: Boolean(data) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Erro inesperado na verificação:", error.message || error);
    return new Response(JSON.stringify({ 
      valid: false, 
      error: error.message || "Erro interno no servidor"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
