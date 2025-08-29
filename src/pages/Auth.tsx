
import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

const Auth = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("register");
  
  // Capturar o parâmetro loja da URL
  const lojaIdentificador = searchParams.get('loja');
  
  // Se vier um state com tab definido, use-o
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  return (
    <div className="container max-w-md mx-auto p-6">
      <Card className="p-4">
        {lojaIdentificador && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Acesso via loja: <strong>{lojaIdentificador}</strong>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="register">Cadastro</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-xl">Cadastre-se</CardTitle>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
          </TabsContent>
          
          <TabsContent value="login">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-xl">Acesse sua conta</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
