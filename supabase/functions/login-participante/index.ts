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

    const { valor_login, senha } = await req.json();

    console.log("=== LOGIN PARTICIPANTE ===");
    console.log("Valor login:", valor_login);

    // Determinar se o valor é email, telefone ou documento
    let campo = 'telefone'; // padrão
    
    if (valor_login.includes('@')) {
      campo = 'email';
    } else if (valor_login.length >= 11) {
      // CPF/CNPJ ou telefone
      const apenasDigitos = valor_login.replace(/\D/g, '');
      if (apenasDigitos.length === 11 || apenasDigitos.length === 14) {
        campo = 'documento';
      }
    }

    console.log("Campo detectado:", campo);

    // Buscar participante
    const { data: participante, error: selectError } = await supabase
      .from('participantes')
      .select('*')
      .eq(campo, valor_login)
      .single();

    if (selectError || !participante) {
      console.log("Participante não encontrado:", selectError);
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

    // Verificar senha usando crypt
    const { data: senhaValida, error: cryptError } = await supabase
      .rpc('verificar_senha', {
        senha_texto: senha,
        senha_hash: participante.senha
      });

    if (cryptError || !senhaValida) {
      console.log("Senha inválida:", cryptError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Senha incorreta'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    // Login bem-sucedido
    const { senha: _, ...participanteSemSenha } = participante;

    return new Response(
      JSON.stringify({
        success: true,
        data: participanteSemSenha
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Erro no login:", error);
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