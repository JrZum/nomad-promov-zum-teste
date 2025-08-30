
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.37.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// CORS Headers para requisições cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("=== INICIANDO CADASTRO-PARTICIPANTE ===");
  console.log("Método da requisição:", req.method);
  console.log("Headers da requisição:", Object.fromEntries(req.headers.entries()));
  
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log("✅ Requisição OPTIONS - retornando CORS headers");
    return new Response(null, { headers: corsHeaders });
  }

  // Verificar se a requisição é POST
  if (req.method !== 'POST') {
    console.log(`Método não permitido: ${req.method}`);
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Verificar autorização
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Autorização ausente ou inválida');
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Autorização necessária",
      code: 401,
      message: "Missing or invalid authorization header" 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Analisar corpo da requisição
    const requestData = await req.json();
    console.log("Dados recebidos:", JSON.stringify({
      ...requestData,
      senha: requestData.senha ? "[REDACTED]" : undefined
    }));
    
    const {
      nome,
      genero,
      email,
      telefone,
      documento,
      rua,
      numero,
      bairro,
      complemento,
      cep,
      cidade,
      uf,
      senha,
      idade,
    } = requestData;

    // Validar campos obrigatórios
    const requiredFields = ['nome', 'documento', 'senha', 'email', 'telefone'];
    const missingFields = requiredFields.filter(field => !requestData[field]);
    
    if (missingFields.length > 0) {
      console.log(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Campos obrigatórios ausentes", 
          missingFields 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log("🔗 Variáveis de ambiente:");
    console.log("- SUPABASE_URL:", supabaseUrl ? "✅ Definida" : "❌ Não definida");
    console.log("- SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Definida" : "❌ Não definida");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Variáveis de ambiente do Supabase não configuradas");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Configuração do servidor incompleta" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`✅ Conectando ao Supabase: ${supabaseUrl.substring(0, 30)}...`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verificar se o documento já existe com consulta explícita
    console.log(`Verificando se o documento já existe: ${documento}`);
    const { data: existingUser, error: checkError } = await supabase
      .from('participantes')
      .select('id')
      .eq('documento', documento)
      .maybeSingle();

    if (checkError) {
      console.error("Erro ao verificar documento:", checkError);
      throw new Error(`Erro na verificação do documento: ${checkError.message}`);
    }

    if (existingUser) {
      console.log(`Documento já cadastrado: ${documento}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Este CPF/CNPJ já está cadastrado" 
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Hash da senha usando bcrypt
    console.log("Gerando hash da senha...");
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Preparar dados para inserção
    const participanteData = {
      nome,
      genero,
      email,
      telefone,
      documento,
      rua,
      numero,
      bairro,
      complemento: complemento || null,
      cep,
      cidade,
      uf,
      idade: idade || '18',
      senha: hashedPassword,
      data_cadastro: new Date().toISOString()
    };
    
    console.log("Estrutura de dados a ser inserida:", JSON.stringify({
      ...participanteData,
      senha: "[REDACTED]"
    }));

    // Inserir novo participante
    const { data, error } = await supabase
      .from('participantes')
      .insert(participanteData)
      .select()
      .single();

    if (error) {
      console.error("Erro na inserção:", error);
      throw new Error(`Erro ao inserir participante: ${error.message}`);
    }

    console.log("Participante cadastrado com sucesso");
    // Retornar resposta de sucesso sem dados sensíveis
    const { senha: _, ...safeData } = data;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Participante cadastrado com sucesso",
        data: safeData
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("❌ ERRO CRÍTICO NO CADASTRO:", error);
    console.error("Stack trace:", error.stack);
    console.error("Tipo do erro:", typeof error);
    console.error("Nome do erro:", error.name);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Falha ao processar o cadastro",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
