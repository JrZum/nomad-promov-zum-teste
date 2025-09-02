import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ResetPasswordRequest {
  identificador: string; // pode ser email, telefone, cpf ou cnpj dependendo da configuração
}

export interface ResetPasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
}

// Função para solicitar reset de senha
export const solicitarResetSenha = async (
  valores: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  try {
    console.log("Solicitando reset de senha para:", valores.identificador);

    // Gerar token de reset
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      'gerar_token_reset_senha',
      {
        p_identificador: valores.identificador
      }
    );

    if (tokenError) {
      console.error("Erro ao gerar token:", tokenError);
      toast({
        title: "Erro ao solicitar reset",
        description: "Erro interno do sistema. Tente novamente.",
        variant: "destructive",
      });
      return { success: false, error: "Erro interno do sistema" };
    }

    const result = tokenData as any;
    if (!result.success) {
      console.log("Falha ao gerar token:", result.error);
      toast({
        title: "Dados não encontrados",
        description: result.error === "Participante não encontrado" 
          ? "Não encontramos um participante com esse identificador"
          : result.error,
        variant: "destructive",
      });
      return { success: false, error: result.error };
    }

    console.log("Token gerado com sucesso para:", result.participante.nome);

    // Enviar webhook para N8N
    const { data: webhookData, error: webhookError } = await supabase.rpc(
      'enviar_webhook_n8n',
      {
        p_participante_id: result.participante.id,
        p_token: result.token,
        p_tipo_notificacao: 'password_reset'
      }
    );

    if (webhookError) {
      console.error("Erro ao enviar webhook:", webhookError);
      // Mesmo com erro no webhook, o token foi gerado, então consideramos sucesso parcial
      toast({
        title: "Reset solicitado",
        description: "Token gerado, mas houve problema no envio da notificação. Entre em contato com o suporte.",
        variant: "destructive",
      });
      return { success: true, message: "Token gerado com problema na notificação" };
    }

    const webhookResult = webhookData as any;
    if (!webhookResult.success) {
      console.log("Falha no webhook N8N:", webhookResult.error);
      toast({
        title: "Reset solicitado",
        description: "Link de reset gerado. Verifique suas mensagens para receber o link.",
      });
      return { success: true, message: "Reset solicitado com sucesso" };
    }

    console.log("Webhook enviado com sucesso para N8N");
    
    toast({
      title: "Reset solicitado com sucesso",
      description: "Você receberá um link para redefinir sua senha. Verifique seu email, SMS ou WhatsApp.",
    });

    return { success: true, message: "Reset solicitado com sucesso" };
  } catch (error) {
    console.error("Erro inesperado ao solicitar reset:", error);
    toast({
      title: "Erro ao solicitar reset",
      description: "Ocorreu um erro inesperado. Tente novamente.",
      variant: "destructive",
    });
    return { success: false, error: "Erro inesperado" };
  }
};

// Função para validar token de reset
export const validarTokenReset = async (token: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('validar_token_reset', {
      p_token: token
    });

    if (error) {
      console.error("Erro ao validar token:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Erro inesperado ao validar token:", error);
    throw error;
  }
};

// Função para redefinir senha com token
export const redefinirSenhaComToken = async (
  token: string, 
  novaSenha: string
): Promise<ResetPasswordResponse> => {
  try {
    const { data, error } = await supabase.rpc('usar_token_reset', {
      p_token: token,
      p_nova_senha: novaSenha
    });

    if (error) {
      console.error("Erro ao redefinir senha:", error);
      toast({
        title: "Erro ao redefinir senha",
        description: "Erro interno do sistema. Tente novamente.",
        variant: "destructive",
      });
      return { success: false, error: "Erro interno do sistema" };
    }

    const result = data as any;
    if (!result.success) {
      toast({
        title: "Erro ao redefinir senha",
        description: result.error,
        variant: "destructive",
      });
      return { success: false, error: result.error };
    }

    toast({
      title: "Senha redefinida com sucesso",
      description: "Sua senha foi alterada. Você já pode fazer login.",
    });

    return { success: true, message: "Senha redefinida com sucesso" };
  } catch (error) {
    console.error("Erro inesperado ao redefinir senha:", error);
    toast({
      title: "Erro ao redefinir senha",
      description: "Ocorreu um erro inesperado. Tente novamente.",
      variant: "destructive",
    });
    return { success: false, error: "Erro inesperado" };
  }
};