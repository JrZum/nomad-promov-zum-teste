
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyAuthentication: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVerification, setLastVerification] = useState<Date>(new Date());

  // Função de verificação que pode ser chamada sob demanda
  const verifyAuthentication = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[AdminAuthContext] Verificando autenticação do administrador");
      
      setLastVerification(new Date());
      // Verificar se há uma sessão ativa no Supabase Auth
      const { data } = await supabase.auth.getSession();
      const isValid = !!data.session;
      
      console.log("[AdminAuthContext] Resultado da verificação:", isValid ? "Sessão válida" : "Sessão inválida");
      setIsAuthenticated(isValid);
      return isValid;
    } catch (error) {
      console.error("[AdminAuthContext] Erro ao verificar autenticação:", error);
      return false;
    }
  }, []);

  // Verificação inicial única
  useEffect(() => {
    const initialCheck = async () => {
      setIsLoading(true);
      console.log("[AdminAuthContext] Realizando verificação inicial de autenticação");
      
      try {
        const { data } = await supabase.auth.getSession();
        const isValid = !!data.session;
        setIsAuthenticated(isValid);
        console.log("[AdminAuthContext] Verificação inicial:", isValid ? "Autenticado" : "Não autenticado");
      } catch (error) {
        console.error("[AdminAuthContext] Erro na verificação inicial:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialCheck();
  }, []);

  // Observer para eventos de autenticação
  useEffect(() => {
    console.log("[AdminAuthContext] Configurando observer de autenticação");
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AdminAuthContext] Evento de autenticação:", event);
        setIsAuthenticated(!!session);
      }
    );
    
    return () => {
      console.log("[AdminAuthContext] Removendo observer de autenticação");
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Configurando verificação periódica longa para validar sessão (a cada 30 minutos)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    console.log("[AdminAuthContext] Configurando verificação periódica (30 minutos)");
    
    const interval = window.setInterval(async () => {
      console.log("[AdminAuthContext] Executando verificação periódica de sessão");
      await verifyAuthentication();
    }, 1800000); // 30 minutos
    
    return () => {
      console.log("[AdminAuthContext] Limpando intervalo de verificação periódica");
      window.clearInterval(interval);
    };
  }, [isAuthenticated, verifyAuthentication]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log("[AdminAuthContext] Iniciando login para:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (error) {
        console.error("[AdminAuthContext] Erro no login:", error.message);
        toast({
          title: "Falha na autenticação",
          description: error.message || "Credenciais inválidas",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("[AdminAuthContext] Login bem-sucedido");
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("[AdminAuthContext] Erro durante login:", error);
      toast({
        title: "Erro de autenticação",
        description: "Ocorreu um erro inesperado durante o login",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Erro ao fazer logout",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setIsAuthenticated(false);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      console.error("[AdminAuthContext] Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar desconectar",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminAuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      login, 
      logout,
      verifyAuthentication 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
