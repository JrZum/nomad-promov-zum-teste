
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateUniqueRandomNumbers(quantity: number, maxNumber: number, existingNumbers: Set<number>): number[] {
  const numbers: number[] = [];
  
  while (numbers.length < quantity) {
    const randomNumber = Math.floor(Math.random() * maxNumber);
    if (!existingNumbers.has(randomNumber) && !numbers.includes(randomNumber)) {
      numbers.push(randomNumber);
    }
  }
  
  return numbers.sort((a, b) => a - b);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente do Supabase usando informações da request
    const supabaseClient = createClient(
      // Usar a nova URL do Supabase
      'https://database-supabase.7hatw3.easypanel.host',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    )

    const { cpf_cnpj, quantidade } = await req.json()
    
    console.log("Recebida requisição para gerar números:", { cpf_cnpj, quantidade });

    if (!cpf_cnpj || !quantidade) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CPF/CNPJ e quantidade são obrigatórios' 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Verificar se o participante já está cadastrado
    const { data: participantes, error: participanteError } = await supabaseClient
      .from('participantes')
      .select('cpf_cnpj')
      .eq('cpf_cnpj', cpf_cnpj)
      .single(); // Use single para garantir que só retorne um registro
      
    if (participanteError) {
      console.error("Erro ao verificar participante:", participanteError);
      
      if (participanteError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'CPF/CNPJ não encontrado'
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw participanteError;
    }
    
    console.log("Resultado da consulta de participante:", participantes);

    // Buscar configuração atual
    const { data: configs, error: configError } = await supabaseClient
      .from('configuracao_campanha')
      .select('series_numericas')
      .single();
    
    if (configError) throw configError;
    
    console.log("Configuração da campanha:", configs);
    
    // Se não existir configuração, tenta criar uma configuração padrão
    const seriesNumericas = configs?.series_numericas || 1;
    
    const maxNumber = seriesNumericas * 100000;
    console.log("Máximo número disponível:", maxNumber);

    // Buscar números existentes
    const { data: existingNumbers, error: numbersError } = await supabaseClient
      .from('numeros_sorte')
      .select('numero');
    
    if (numbersError) throw numbersError;

    const existingSet = new Set(existingNumbers?.map(n => n.numero) || []);
    console.log("Total de números existentes:", existingSet.size);

    // Gerar novos números
    const novosNumeros = generateUniqueRandomNumbers(
      parseInt(quantidade.toString()), 
      maxNumber, 
      existingSet
    );
    
    console.log("Novos números gerados:", novosNumeros);

    // Inserir números gerados com a observação
    const { error: insertError } = await supabaseClient
      .from('numeros_sorte')
      .insert(novosNumeros.map(numero => ({
        numero,
        cpf_cnpj,
        obs: "Número gerado manualmente"
      })));
    
    if (insertError) {
      console.error("Erro ao inserir números:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        numeros: novosNumeros 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
