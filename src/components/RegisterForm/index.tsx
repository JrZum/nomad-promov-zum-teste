
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Info, AlertCircle, CheckCircle } from "lucide-react";
import { registerSchema, RegisterFormValues } from "./schema";
import PersonalInfoFields from "./PersonalInfoFields";
import AddressFields from "./AddressFields";
import SecurityFields from "./SecurityFields";
import AcceptanceFields from "./AcceptanceFields";
import { registerParticipant } from "./RegisterService";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Capturar o parâmetro loja da URL
  const lojaIdentificador = searchParams.get('loja');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: "",
      data_nascimento: new Date(), // Inicializar com data padrão
      email: "",
      telefone: "",
      documento: "",
      rua: "",
      numero: "",
      bairro: "",
      complemento: "",
      cep: "",
      cidade: "",
      uf: "",
      senha: "",
      confirmarSenha: "",
      aceitePolitica: false,
      aceiteMarketing: false
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    console.log("FORM SUBMIT TRIGGERED!!!"); // Log simples para debug
    console.log("=== ONSUBMIT INICIADO ===");
    console.log("Valores do formulário:", values);
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log("Chamando registerParticipant...");
      const result = await registerParticipant(values, lojaIdentificador || undefined);
      console.log("Resultado recebido:", result);
      
      if (result.success) {
        console.log("Cadastro bem-sucedido!");
        // Resetar formulário
        form.reset();
        
        // Mostrar popup de sucesso
        setShowSuccessDialog(true);
        
        // Redirecionar para o login após 3 segundos
        setTimeout(() => {
          setShowSuccessDialog(false);
          navigate('/auth', { state: { tab: 'login' } });
        }, 3000);
      } else {
        console.log("Erro no cadastro:", result.error);
        setErrorMessage(result.error || null);
      }
    } catch (error) {
      console.error("Erro catch onSubmit:", error);
      setErrorMessage("Erro inesperado no formulário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    navigate('/auth', { state: { tab: 'login' } });
  };

  return (
    <>
      <Form {...form}>
        {lojaIdentificador && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Você está se cadastrando através da loja: <strong>{lojaIdentificador}</strong>
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no cadastro</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <PersonalInfoFields form={form} />
            <AddressFields form={form} />
            <SecurityFields form={form} />
            <AcceptanceFields form={form} />
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Campos marcados com * são de preenchimento obrigatório
            </AlertDescription>
          </Alert>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
      </Form>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-green-800">
              Cadastro Realizado com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Seu cadastro foi realizado com sucesso. Você será redirecionado para a página de login em alguns segundos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={handleSuccessDialogClose} className="bg-green-600 hover:bg-green-700">
              Ir para Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegisterForm;
