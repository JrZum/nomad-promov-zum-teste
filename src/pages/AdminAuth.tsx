
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAuth } from "@/context/AdminAuthContext";
import AdminLoginForm from "@/components/AdminLoginForm";

const AdminAuth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [redirected, setRedirected] = useState(false);
  
  // Redirect to dashboard if already authenticated - apenas uma vez
  useEffect(() => {
    if (!isLoading && isAuthenticated && !redirected) {
      console.log("[AdminAuth] Usuário já autenticado, redirecionando para o dashboard");
      setRedirected(true);
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, redirected]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto p-6 flex items-center justify-center min-h-screen">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  // Se já foi redirecionado ou está autenticado, não renderiza novamente
  if (redirected || isAuthenticated) {
    return (
      <div className="container max-w-md mx-auto p-6 flex items-center justify-center min-h-screen">
        <p>Redirecionando para o dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-6">
      <div className="flex justify-center mb-6">
        <img src="/lovable-uploads/6cd8073f-e454-49ac-a371-86bb9a2adedf.png" alt="zum Logo" className="h-16 w-auto" />
      </div>
      <Card className="p-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-xl">Login Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
