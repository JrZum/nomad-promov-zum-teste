
import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { useLojaAuth } from "@/hooks/useLojaAuth";
import LojaBanner from "@/components/LojaBanner";

const Auth = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("register");
  const { loja, isLoading: isLojaLoading, error: lojaError, isLojaMode } = useLojaAuth();
  
  // Se vier um state com tab definido, use-o
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  if (isLojaMode && isLojaLoading) {
    return (
      <div className="container max-w-md mx-auto p-6">
        <Card className="p-4">
          <div className="text-center py-8">Verificando loja...</div>
        </Card>
      </div>
    );
  }

  if (isLojaMode && lojaError) {
    return (
      <div className="container max-w-md mx-auto p-6">
        <Card className="p-4">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>{lojaError}</AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-6">
      {loja && <LojaBanner loja={loja} />}
      <Card className="p-4">

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
