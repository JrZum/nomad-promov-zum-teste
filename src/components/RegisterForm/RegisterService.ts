
import { RegisterFormValues } from "./schema";
import { authService, RegisterData } from "@/services/authService";

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

    // Preparar dados para o authService
    const registerData: RegisterData = {
      nome: values.nome,
      email: values.email,
      telefone: values.telefone,
      documento: values.documento,
      rua: values.rua,
      numero: values.numero,
      bairro: values.bairro,
      complemento: values.complemento || '',
      cep: values.cep,
      cidade: values.cidade,
      uf: values.uf,
      senha: values.senha,
      genero: 'Não informado',
      idade: values.data_nascimento ? String(new Date().getFullYear() - values.data_nascimento.getFullYear()) : '18',
      loja_origem: lojaIdentificador || null
    };

    console.log("Chamando authService.registerParticipant...");
    const result = await authService.registerParticipant(registerData);
    
    console.log("Resultado do authService:", result);

    if (result.success) {
      console.log("Participante cadastrado com sucesso!");
      return { success: true };
    } else {
      console.log("Erro no cadastro:", result.error);
      
      // Tratar erros específicos com mensagens mais claras
      if (result.error) {
        const errorMessage = result.error.toLowerCase();
        
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
        error: result.error || "Erro interno do sistema. Por favor, verifique seus dados e tente novamente. Se o problema persistir, entre em contato com o suporte."
      };
    }

  } catch (error) {
    console.error("Erro inesperado no registerParticipant:", error);
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente."
    };
  }
};
