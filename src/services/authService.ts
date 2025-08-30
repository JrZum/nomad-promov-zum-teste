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
}

export interface RegisterResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export const authService = {
  async registerParticipant(data: RegisterData): Promise<RegisterResponse> {
    try {
      console.log("=== CHAMANDO EDGE FUNCTION ===");
      console.log("Dados para envio:", {
        ...data,
        senha: "[REDACTED]"
      });

      // Chamar a Edge Function
      const { data: response, error } = await supabase.functions.invoke('cadastro-participante', {
        body: {
          nome: data.nome,
          genero: data.genero || 'Não informado',
          email: data.email,
          telefone: data.telefone,
          documento: data.documento,
          rua: data.rua,
          numero: data.numero,
          bairro: data.bairro,
          complemento: data.complemento || '',
          cep: data.cep,
          cidade: data.cidade,
          uf: data.uf,
          senha: data.senha
        }
      });

      console.log("Resposta da Edge Function:", response);
      console.log("Erro da Edge Function:", error);

      if (error) {
        console.error("Erro na Edge Function:", error);
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

      // A Edge Function retorna um objeto com success, error, etc.
      if (response.success) {
        console.log("Cadastro realizado com sucesso via Edge Function!");
        return {
          success: true,
          data: response.data
        };
      } else {
        console.log("Erro retornado pela Edge Function:", response.error);
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