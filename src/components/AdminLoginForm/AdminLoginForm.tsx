
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, AdminLoginFormValues } from "./schema";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "@/hooks/use-toast";

const AdminLoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  
  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: AdminLoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Debug logging
      console.log("Iniciando processo de login admin com:", values.email);
      
      // Trim input values to prevent whitespace issues
      const success = await login(values.email.trim(), values.password.trim());
      
      console.log("Resultado do login:", success ? "Sucesso" : "Falha");
      
      if (success) {
        toast({
          title: "Login administrativo bem-sucedido",
          description: "Você está sendo redirecionado para o painel administrativo",
        });
        
        // Added a delay to ensure toast is shown before navigation
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);
      }
      // Não precisamos tratar falha aqui, pois o AdminAuthContext já mostra um toast
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
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
      </form>
    </Form>
  );
};

export default AdminLoginForm;
