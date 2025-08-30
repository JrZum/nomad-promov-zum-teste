
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RegisterFormValues } from "./schema";

export const registerParticipant = async (values: RegisterFormValues, lojaIdentificador?: string) => {
  try {
    console.log("=== INÍCIO DO CADASTRO ===");
    console.log("Dados recebidos:", {
      nome: values.nome,
      email: values.email,
      telefone: values.telefone,
      documento: values.documento,
      cidade: values.cidade,
      uf: values.uf,
      loja: lojaIdentificador
    });
    
    // Usar a função RPC existente no banco
    console.log("Chamando função cadastrar_participante com os parâmetros:");
    // A função espera os parâmetros nesta ordem exata:
    // p_documento, p_nome, p_email, p_telefone, p_genero, p_idade, p_rua, p_numero, p_complemento, p_bairro, p_cidade, p_cep, p_uf, p_senha
    const rpcParams = {
      p_documento: values.documento,
      p_nome: values.nome,
      p_email: values.email,
      p_telefone: values.telefone,
      p_genero: 'Não informado',
      p_idade: values.data_nascimento ? new Date().getFullYear() - values.data_nascimento.getFullYear() : '18', // Calcular idade a partir da data de nascimento
      p_rua: values.rua,
      p_numero: values.numero,
      p_complemento: values.complemento || '',
      p_bairro: values.bairro,
      p_cidade: values.cidade,
      p_cep: values.cep,
      p_uf: values.uf,
      p_senha: values.senha
    };
    console.log("Parâmetros RPC:", rpcParams);
    
    // Configurar timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na chamada do banco')), 10000)
    );
    
    const rpcPromise = supabase.rpc('cadastrar_participante', rpcParams);
    
    const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
    
    console.log("Resultado da chamada RPC:");
    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
      console.error("Erro na função de cadastro:", error);
      
      // Tratar erros específicos com mensagens mais claras
      if (error.message) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('já está cadastrado') || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
          return {
            success: false,
            error: "Este CPF/CNPJ já está cadastrado no sistema. Por favor, use um documento diferente ou faça login se já possui uma conta."
          };
        }
        
        if (errorMessage.includes('email') && (errorMessage.includes('duplicate') || errorMessage.includes('unique'))) {
          return {
            success: false,
            error: "Este e-mail já está sendo usado por outra conta. Por favor, use um e-mail diferente ou faça login."
          };
        }
        
        if (errorMessage.includes('telefone') && (errorMessage.includes('duplicate') || errorMessage.includes('unique'))) {
          return {
            success: false,
            error: "Este telefone já está cadastrado. Por favor, use um telefone diferente ou faça login se já possui uma conta."
          };
        }
        
        if (errorMessage.includes('required') || errorMessage.includes('obrigatório')) {
          return {
            success: false,
            error: "Por favor, preencha todos os campos obrigatórios antes de continuar."
          };
        }
        
        if (errorMessage.includes('invalid') || errorMessage.includes('inválido')) {
          return {
            success: false,
            error: "Alguns dados fornecidos são inválidos. Verifique se o CPF/CNPJ, e-mail e telefone estão corretos."
          };
        }
        
        if (errorMessage.includes('format') || errorMessage.includes('formato')) {
          return {
            success: false,
            error: "Formato de dados incorreto. Verifique se todos os campos estão preenchidos corretamente."
          };
        }
      }
      
      return {
        success: false,
        error: "Erro interno do sistema. Por favor, verifique seus dados e tente novamente. Se o problema persistir, entre em contato com o suporte."
      };
    }

    const result = data as any;
    console.log("Verificando resultado:", result);
    
    if (!result || result.success === false) {
      console.log("Falha no cadastro retornada pela função:", result?.error || "Resultado inválido");
      return {
        success: false,
        error: result?.error || "Erro no processamento do cadastro."
      };
    }

    console.log("Participante cadastrado com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("Erro inesperado ao cadastrar:", error);
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente."
    };
  }
};
