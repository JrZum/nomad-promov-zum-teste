import { supabase } from "@/integrations/supabase/client";

// Função de teste para edge functions
export const testEdgeFunctions = async () => {
  console.log("=== INICIANDO TESTE DAS EDGE FUNCTIONS ===");

  // Teste 1: Cadastro de participante
  console.log("\n1. Testando cadastro de participante...");
  try {
    const testData = {
      nome: "Teste User",
      email: "teste@example.com",
      telefone: "11999999999",
      documento: "12345678901",
      rua: "Rua Teste",
      numero: "123",
      bairro: "Bairro Teste",
      cep: "12345-678",
      cidade: "São Paulo",
      uf: "SP",
      senha: "123456",
      idade: "25",
      genero: "M"
    };

    const { data: cadastroResult, error: cadastroError } = await supabase.functions.invoke('cadastro-participante', {
      body: testData
    });

    if (cadastroError) {
      console.error("❌ Erro no cadastro:", cadastroError);
      return false;
    }

    console.log("✅ Cadastro testado com sucesso:", cadastroResult);

    // Teste 2: Login do participante
    console.log("\n2. Testando login do participante...");
    const { data: loginResult, error: loginError } = await supabase.functions.invoke('login-participante', {
      body: {
        valor_login: testData.email,
        senha: testData.senha
      }
    });

    if (loginError) {
      console.error("❌ Erro no login:", loginError);
      return false;
    }

    console.log("✅ Login testado com sucesso:", loginResult);

    // Teste 3: Configuração de login
    console.log("\n3. Testando configuração de login...");
    const { data: configResult, error: configError } = await supabase.functions.invoke('configuracao-login');

    if (configError) {
      console.error("❌ Erro na configuração:", configError);
      return false;
    }

    console.log("✅ Configuração testada com sucesso:", configResult);

    // Teste 4: Lojas
    console.log("\n4. Testando listagem de lojas...");
    const { data: lojasResult, error: lojasError } = await supabase.functions.invoke('lojas');

    if (lojasError) {
      console.error("❌ Erro nas lojas:", lojasError);
      return false;
    }

    console.log("✅ Lojas testadas com sucesso:", lojasResult);

    console.log("\n🎉 TODOS OS TESTES PASSARAM!");
    return true;

  } catch (error) {
    console.error("❌ Erro geral no teste:", error);
    return false;
  }
};

// Função para testar apenas uma edge function específica
export const testSingleFunction = async (functionName: string, body?: any) => {
  console.log(`=== TESTANDO ${functionName.toUpperCase()} ===`);
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    
    if (error) {
      console.error(`❌ Erro em ${functionName}:`, error);
      return false;
    }
    
    console.log(`✅ ${functionName} funcionando:`, data);
    return true;
  } catch (error) {
    console.error(`❌ Erro geral em ${functionName}:`, error);
    return false;
  }
};

// Auto-executar teste básico quando importado
if (typeof window !== 'undefined') {
  console.log("🧪 Testador de Edge Functions carregado. Use:");
  console.log("- testEdgeFunctions() para teste completo");
  console.log("- testSingleFunction('nome-da-funcao', dados) para teste específico");
}