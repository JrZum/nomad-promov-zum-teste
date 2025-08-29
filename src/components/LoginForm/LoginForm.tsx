
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { loginSchema, LoginFormValues } from "./schema";
import { loginParticipante } from "./LoginService";
import { useLoginConfiguration } from "@/hooks/useLoginConfiguration";
import ResetPasswordForm from "./ResetPasswordForm";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginMethod, isLoading: configLoading } = useLoginConfiguration();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      telefone: "",
      senha: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    const { success } = await loginParticipante(values);
    if (success) {
      navigate("/numeros");
    }
    setIsLoading(false);
  };

  const getFieldLabel = () => {
    switch (loginMethod) {
      case "celular":
        return "Celular";
      case "cpf":
        return "CPF";
      case "cnpj":
        return "CNPJ";
      case "email":
        return "E-mail";
      default:
        return "Celular";
    }
  };

  const getFieldPlaceholder = () => {
    switch (loginMethod) {
      case "celular":
        return "Digite seu celular";
      case "cpf":
        return "Digite seu CPF";
      case "cnpj":
        return "Digite seu CNPJ";
      case "email":
        return "Digite seu e-mail";
      default:
        return "Digite seu celular";
    }
  };

  const getFieldType = () => {
    switch (loginMethod) {
      case "email":
        return "email";
      default:
        return "text";
    }
  };

  if (configLoading) {
    return (
      <Card className="p-4">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando configuração...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getFieldLabel()}</FormLabel>
                <FormControl>
                  <Input 
                    type={getFieldType()}
                    placeholder={getFieldPlaceholder()} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="senha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Digite sua senha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          
          <div className="text-center mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-primary hover:text-primary/80" type="button">
                  Esqueci minha senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-center">Recuperação de Senha</DialogTitle>
                </DialogHeader>
                <ResetPasswordForm />
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </Form>
    </>
  );
};

export default LoginForm;
