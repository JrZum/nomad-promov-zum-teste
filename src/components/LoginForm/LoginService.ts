import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LoginFormValues, ResetPasswordFormValues } from "./schema";

export const loginParticipante = async (values: LoginFormValues) => {
  try {
    console.log("Tentando fazer login com valor:", values.telefone);
    
    // Usar a função de login dinâmico do banco que já determina o campo correto
    const { data, error } = await supabase.rpc('login_participante_dinamico' as any, {
      p_valor_login: values.telefone, // O nome do campo continua 'telefone' mas o valor pode ser qualquer coisa
      p_senha: values.senha
    });

    if (error) {
      console.error("Erro na função de login:", error);
      toast({
        title: "Erro ao fazer login",
        description: "Erro interno do sistema. Tente novamente.",
        variant: "destructive",
      });
      return { success: false };
    }

    const result = data as any;
    if (!result.success) {
      console.log("Falha no login:", result.error);
      toast({
        title: "Erro ao fazer login",
        description: result.error === "Participante não encontrado" ? "Dados não encontrados" : "Senha incorreta",
        variant: "destructive",
      });
      return { success: false };
    }

    const participante = result.participante;
    
    // Salvar dados do participante no localStorage
    localStorage.setItem("participanteId", participante.id);
    localStorage.setItem("participanteDocumento", participante.documento);
    
    console.log("Login realizado com sucesso para:", participante.nome);
    
    toast({
      title: "Login realizado com sucesso",
      description: `Bem-vindo(a), ${participante.nome}!`,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro inesperado ao fazer login:", error);
    toast({
      title: "Erro ao fazer login",
      description: "Ocorreu um erro inesperado. Tente novamente.",
      variant: "destructive",
    });
    return { success: false };
  }
};

export const resetarSenhaParticipante = async (values: ResetPasswordFormValues) => {
  try {
    console.log("Tentando resetar senha para telefone:", values.telefone);
    
    // Verificar se o participante existe com o telefone e email informados
    const { data: participante, error: participanteError } = await supabase
      .from("participantes")
      .select("id, telefone, email, nome")
      .eq("telefone", values.telefone)
      .eq("email", values.email)
      .maybeSingle();

    if (participanteError) {
      console.error("Erro ao buscar participante:", participanteError);
      toast({
        title: "Erro ao redefinir senha",
        description: "Erro interno do sistema. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }

    if (!participante) {
      console.log("Participante não encontrado para reset - telefone:", values.telefone, "email:", values.email);
      toast({
        title: "Dados não encontrados",
        description: "Não encontramos um participante com esse celular e email",
        variant: "destructive",
      });
      return false;
    }

    console.log("Participante encontrado para reset:", participante.nome);

    // Gerar uma nova senha aleatória
    const novaSenha = Math.random().toString(36).slice(-8);

    // Atualizar a senha no banco
    const { error: updateError } = await supabase
      .from("participantes")
      .update({ senha: novaSenha })
      .eq("id", participante.id);

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      toast({
        title: "Erro ao redefinir senha",
        description: "Não foi possível atualizar a senha. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }

    console.log("Senha redefinida com sucesso para:", participante.nome);

    // Exibir a nova senha para o usuário (em produção, seria enviado por email)
    toast({
      title: "Senha redefinida com sucesso",
      description: `Sua nova senha é: ${novaSenha}`,
      duration: 10000,
    });
    
    return true;
  } catch (error) {
    console.error("Erro inesperado ao redefinir senha:", error);
    toast({
      title: "Erro ao redefinir senha",
      description: "Ocorreu um erro inesperado. Tente novamente.",
      variant: "destructive",
    });
    return false;
  }
};
