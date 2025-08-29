import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type LoginMethod = "celular" | "cpf" | "cnpj" | "email";

interface LoginConfiguration {
  id?: string;
  metodo_login: LoginMethod;
}

const LoginMethodConfiguration = () => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("celular");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      // Use direct query to configuracao_login table through raw SQL
      const { data, error } = await supabase
        .rpc('obter_configuracao_login' as any);

      if (error) {
        console.error("Erro ao carregar configuração:", error);
        toast({
          title: "Erro ao carregar configuração",
          description: "Não foi possível carregar a configuração atual.",
          variant: "destructive",
        });
        return;
      }

      const result = data as any;
      if (result && result.success && result.metodo_login) {
        setLoginMethod(result.metodo_login);
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.rpc('salvar_configuracao_login' as any, {
        p_metodo_login: loginMethod
      });

      if (error) {
        console.error("Erro ao salvar configuração:", error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a configuração.",
          variant: "destructive",
        });
        return;
      }

      // Invalidar cache do hook de configuração de login
      queryClient.invalidateQueries({ queryKey: ["login-configuration"] });

      toast({
        title: "Configuração salva",
        description: `Método de login definido para: ${getMethodLabel(loginMethod)}`,
      });
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMethodLabel = (method: LoginMethod): string => {
    const labels = {
      celular: "Celular",
      cpf: "CPF",
      cnpj: "CNPJ",
      email: "E-mail"
    };
    return labels[method];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configuração...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Método de Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="login-method">Método de Login dos Participantes</Label>
          <Select value={loginMethod} onValueChange={(value) => setLoginMethod(value as LoginMethod)}>
            <SelectTrigger id="login-method">
              <SelectValue placeholder="Selecione o método de login" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="celular">Celular</SelectItem>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Define como os participantes farão login na plataforma
          </p>
        </div>

        <Button 
          onClick={saveConfiguration} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginMethodConfiguration;
