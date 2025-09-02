
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLoginConfiguration } from "@/hooks/useLoginConfiguration";
import { solicitarResetSenha } from "./ResetPasswordService";
import { z } from "zod";

// Schema dinâmico baseado no método de login
const createResetPasswordSchema = (loginMethod: string) => {
  return z.object({
    identificador: z.string().min(1, { 
      message: loginMethod === "email" 
        ? "Email é obrigatório" 
        : loginMethod === "cpf"
        ? "CPF é obrigatório"
        : loginMethod === "cnpj" 
        ? "CNPJ é obrigatório"
        : "Celular é obrigatório" 
    }),
  });
};

type ResetPasswordFormValues = {
  identificador: string;
};

const ResetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginMethod, isLoading: configLoading } = useLoginConfiguration();

  const resetPasswordSchema = createResetPasswordSchema(loginMethod);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      identificador: "",
    },
  });

  // Helper functions para labels e placeholders dinâmicos
  const getFieldLabel = () => {
    switch (loginMethod) {
      case "email": return "Email";
      case "cpf": return "CPF";
      case "cnpj": return "CNPJ";
      default: return "Celular";
    }
  };

  const getFieldPlaceholder = () => {
    switch (loginMethod) {
      case "email": return "Digite seu email";
      case "cpf": return "Digite seu CPF";
      case "cnpj": return "Digite seu CNPJ";
      default: return "Digite seu celular";
    }
  };

  const getFieldType = () => {
    return loginMethod === "email" ? "email" : "text";
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    const result = await solicitarResetSenha(values);
    if (result.success) {
      form.reset();
    }
    setIsLoading(false);
  };

  if (configLoading) {
    return <div className="text-center">Carregando configuração...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="identificador"
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Enviando..." : "Solicitar Reset de Senha"}
        </Button>
      </form>
    </Form>
  );
};

export default ResetPasswordForm;
