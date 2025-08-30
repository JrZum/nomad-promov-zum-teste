import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      // Obter configuração
      const { data, error } = await supabase
        .from('configuracao_login')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
        console.error("Erro ao buscar configuração:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erro ao buscar configuração'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      // Se não existe configuração, retorna padrão
      const configuracao = data || { metodo_login: 'telefone' };

      return new Response(
        JSON.stringify({
          success: true,
          data: configuracao
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      // Salvar configuração
      const { metodo_login } = await req.json();

      const { data, error } = await supabase
        .from('configuracao_login')
        .upsert({ metodo_login })
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar configuração:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erro ao salvar configuração'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Método não permitido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );

  } catch (error) {
    console.error("Erro na configuração de login:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});