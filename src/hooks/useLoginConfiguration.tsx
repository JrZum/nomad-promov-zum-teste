
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type LoginMethod = "celular" | "cpf" | "cnpj" | "email";

export const useLoginConfiguration = () => {
  const {
    data: loginConfig,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["login-configuration"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('configuracao-login');

        if (error) {
          console.error("Erro ao buscar configuração de login:", error);
          throw error;
        }

        const result = data as any;
        if (result && result.success) {
          return {
            metodo_login: result.metodo_login as LoginMethod,
            is_default: result.is_default || false
          };
        }

        // Fallback para celular se não conseguir buscar
        return {
          metodo_login: "celular" as LoginMethod,
          is_default: true
        };
      } catch (err) {
        console.error("Erro inesperado ao buscar configuração:", err);
        return {
          metodo_login: "celular" as LoginMethod,
          is_default: true
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true
  });

  return {
    loginMethod: loginConfig?.metodo_login || "celular",
    isDefault: loginConfig?.is_default || true,
    isLoading,
    error,
    refetch
  };
};
