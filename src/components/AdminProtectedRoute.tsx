
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "@/hooks/use-toast";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  
  // Verificação inicial única quando o componente é montado
  useEffect(() => {
    // Só verifica se não estiver carregando e não estiver autenticado
    if (!isLoading && !isAuthenticated) {
      console.log("[AdminProtectedRoute] Usuário não autenticado, redirecionando para login");
      toast({
        title: "Acesso restrito",
        description: "Esta área é restrita a administradores",
        variant: "destructive",
      });
      navigate("/admin");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Mostrar estado de carregamento enquanto verifica autenticação inicialmente
  if (isLoading) {
    return <div className="container mx-auto p-6 flex justify-center">Verificando autenticação...</div>;
  }

  // Usuário autenticado, renderiza filhos
  return isAuthenticated ? <>{children}</> : null;
};

export default AdminProtectedRoute;
