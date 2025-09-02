import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { validarTokenReset, redefinirSenhaComToken } from "@/components/LoginForm/ResetPasswordService";

const newPasswordSchema = z.object({
  senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmarSenha: z.string().min(6, { message: "Confirmação de senha é obrigatória" }),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [participante, setParticipante] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const token = searchParams.get("token");

  const form = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      senha: "",
      confirmarSenha: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setError("Token de reset não encontrado na URL");
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const result = await validarTokenReset(token);
        if (result.success) {
          setTokenValid(true);
          setParticipante(result.participante);
        } else {
          setError(result.error || "Token inválido");
        }
      } catch (err) {
        setError("Erro ao validar token");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (values: NewPasswordFormValues) => {
    if (!token) return;

    setIsLoading(true);
    const result = await redefinirSenhaComToken(token, values.senha);
    
    if (result.success) {
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate("/auth", { state: { tab: "login" } });
      }, 2000);
    }
    
    setIsLoading(false);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Validando token de reset...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Link Inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "O link de reset de senha é inválido ou expirou."}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full mt-4"
              variant="outline"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Redefinir Senha</CardTitle>
          {participante && (
            <p className="text-center text-sm text-muted-foreground">
              Olá, {participante.nome}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite sua nova senha" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirme sua nova senha" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;