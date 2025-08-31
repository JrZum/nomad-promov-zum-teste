import { supabase } from "@/integrations/supabase/client";

export interface RegisterData {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;
  cep: string;
  cidade: string;
  uf: string;
  senha: string;
  genero?: string;
  idade?: string;
  loja_origem?: string | null;
}

export interface RegisterResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export const authService = {
  async registerParticipant(data: RegisterData): Promise<RegisterResponse> {
    try {
      console.log("=== CHAMANDO DATABASE FUNCTION ===");
      console.log("Dados para envio:", {
        ...data,
        senha: "[REDACTED]"
      });

      // Verificar se deve usar função com ou sem loja
      const functionName = data.loja_origem ? 'cadastrar_participante_com_loja' : 'cadastrar_participante_completo';
      
      console.log(`Usando função: ${functionName}`);
      
      let rpcCall;
      if (data.loja_origem) {
        rpcCall = supabase.rpc('cadastrar_participante_com_loja', {
          p_nome: data.nome,
          p_genero: data.genero || 'Não informado',
          p_email: data.email,
          p_telefone: data.telefone,
          p_documento: data.documento,
          p_rua: data.rua,
          p_numero: data.numero,
          p_bairro: data.bairro,
          p_complemento: data.complemento || '',
          p_cep: data.cep,
          p_cidade: data.cidade,
          p_uf: data.uf,
          p_senha: data.senha,
          p_idade: data.idade || '18',
          p_loja_origem: data.loja_origem
        });
      } else {
        rpcCall = supabase.rpc('cadastrar_participante_completo', {
          p_nome: data.nome,
          p_genero: data.genero || 'Não informado',
          p_email: data.email,
          p_telefone: data.telefone,
          p_documento: data.documento,
          p_rua: data.rua,
          p_numero: data.numero,
          p_bairro: data.bairro,
          p_complemento: data.complemento || '',
          p_cep: data.cep,
          p_cidade: data.cidade,
          p_uf: data.uf,
          p_senha: data.senha,
          p_idade: data.idade || '18'
        });
      }
      
      const { data: response, error } = await rpcCall;

      console.log("Resposta da Database Function:", response);
      console.log("Erro da Database Function:", error);

      if (error) {
        console.error("Erro na Database Function:", error);
        return {
          success: false,
          error: error.message || "Erro na comunicação com o servidor"
        };
      }

      if (!response) {
        return {
          success: false,
          error: "Resposta vazia do servidor"
        };
      }

      // A Database Function retorna um objeto com success, error, etc.
      if (response.success) {
        console.log("Cadastro realizado com sucesso via Database Function!");
        return {
          success: true,
          data: response.data
        };
      } else {
        console.log("Erro retornado pela Database Function:", response.error);
        return {
          success: false,
          error: response.error || "Erro no processamento do cadastro"
        };
      }

    } catch (error) {
      console.error("Erro inesperado no authService:", error);
      return {
        success: false,
        error: "Erro inesperado no cadastro. Tente novamente."
      };
    }
  }
};