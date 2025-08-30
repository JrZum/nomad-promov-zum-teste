
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
    const rpcParams = {
      p_nome: values.nome,
      p_genero: 'Não informado', // Campo obrigatório na função
      p_email: values.email,
      p_telefone: values.telefone,
      p_documento: values.documento,
      p_rua: values.rua,
      p_numero: values.numero,
      p_bairro: values.bairro,
      p_complemento: values.complemento || null,
      p_cep: values.cep,
      p_cidade: values.cidade,
      p_uf: values.uf,
      p_senha: values.senha,
      p_data_cadastro: new Date().toISOString()
    };
    console.log("Parâmetros RPC:", rpcParams);
    
    const { data, error } = await supabase.rpc('cadastrar_participante', rpcParams);
    
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
