
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RegisterFormValues } from "./schema";

export const registerParticipant = async (values: RegisterFormValues, lojaIdentificador?: string) => {
  try {
    console.log("Tentando cadastrar participante...", { nome: values.nome, loja: lojaIdentificador });
    
    // Usar a função RPC existente no banco
    const { data, error } = await supabase.rpc('cadastrar_participante', {
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
    });

    if (error) {
      console.error("Erro na função de cadastro:", error);
      
      // Tratar erro específico de CPF/CNPJ já cadastrado
      if (error.message && error.message.includes('já está cadastrado')) {
        return {
          success: false,
          error: "Este CPF/CNPJ já está cadastrado. Use um documento diferente."
        };
      }
      
      return {
        success: false,
        error: "Erro interno do sistema. Tente novamente."
      };
    }

    const result = data as any;
    if (!result.success) {
      console.log("Falha no cadastro:", result.error);
      return {
        success: false,
        error: result.error
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
