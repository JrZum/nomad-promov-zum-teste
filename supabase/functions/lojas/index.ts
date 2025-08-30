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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      // Obter todas as lojas
      const { data: lojas, error } = await supabase
        .from('lojas_participantes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar lojas:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erro ao buscar lojas'
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
          lojas: lojas || []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (action === 'cadastrar') {
        // Cadastrar nova loja
        const { nome_loja, identificador_url, descricao } = body;

        // Verificar se já existe loja com mesmo identificador
        const { data: lojaExistente } = await supabase
          .from('lojas_participantes')
          .select('id')
          .eq('identificador_url', identificador_url)
          .single();

        if (lojaExistente) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Já existe uma loja com este identificador'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        const { data, error } = await supabase
          .from('lojas_participantes')
          .insert({
            nome_loja,
            identificador_url,
            descricao,
            ativa: true
          })
          .select()
          .single();

        if (error) {
          console.error("Erro ao cadastrar loja:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Erro ao cadastrar loja'
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
            message: 'Loja cadastrada com sucesso',
            data: data
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (action === 'status') {
        // Alterar status da loja
        const { loja_id, ativa } = body;

        const { data, error } = await supabase
          .from('lojas_participantes')
          .update({ ativa })
          .eq('id', loja_id)
          .select()
          .single();

        if (error) {
          console.error("Erro ao alterar status da loja:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Erro ao alterar status da loja'
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
            message: `Loja ${ativa ? 'ativada' : 'desativada'} com sucesso`,
            data: data
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Ação não reconhecida'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );

  } catch (error) {
    console.error("Erro na gestão de lojas:", error);
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