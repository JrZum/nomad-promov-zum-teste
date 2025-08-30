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

    const { documento, numeros } = await req.json();

    console.log("=== GERAR NÚMEROS ===");
    console.log("Documento:", documento);
    console.log("Números:", numeros);

    if (!documento || !numeros || !Array.isArray(numeros)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Dados inválidos'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Verificar se participante existe
    const { data: participante, error: participanteError } = await supabase
      .from('participantes')
      .select('id')
      .eq('documento', documento)
      .single();

    if (participanteError || !participante) {
      console.log("Participante não encontrado:", participanteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Participante não encontrado'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Inserir números na tabela numeros_sorte
    const numerosParaInserir = numeros.map(numero => ({
      numero: numero,
      documento: documento,
      obs: 'Gerado automaticamente'
    }));

    const { data: numerosInseridos, error: insertError } = await supabase
      .from('numeros_sorte')
      .insert(numerosParaInserir)
      .select();

    if (insertError) {
      console.error("Erro ao inserir números:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao inserir números da sorte'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Atualizar quantidade de números do participante
    const { error: updateError } = await supabase
      .from('participantes')
      .update({ 
        quantidade_numeros: numerosInseridos.length 
      })
      .eq('documento', documento);

    if (updateError) {
      console.error("Erro ao atualizar quantidade:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${numeros.length} números gerados com sucesso`,
        data: {
          numeros_inseridos: numerosInseridos.length,
          numeros: numeros
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Erro na geração de números:", error);
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