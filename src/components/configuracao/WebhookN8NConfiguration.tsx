import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Webhook, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const WebhookN8NConfiguration = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('obter_configuracao_webhook_n8n');

      if (error) {
        console.error("Erro ao carregar configuração do webhook:", error);
        toast({
          title: "Erro ao carregar configuração",
          description: "Não foi possível carregar a configuração do webhook N8N.",
          variant: "destructive",
        });
        return;
      }

      const result = data as any;
      if (result && result.success) {
        setWebhookUrl(result.webhook_url || "");
      }
    } catch (error) {
      console.error("Erro inesperado ao carregar configuração:", error);
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
      const { data, error } = await supabase.rpc('salvar_configuracao_webhook_n8n', {
        p_webhook_url: webhookUrl
      });

      if (error) {
        console.error("Erro ao salvar configuração:", error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a configuração do webhook.",
          variant: "destructive",
        });
        return;
      }

      const result = data as any;
      if (result && result.success) {
        toast({
          title: "Configuração salva",
          description: "URL do webhook N8N configurada com sucesso!",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: result.error || "Erro desconhecido ao salvar configuração.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro inesperado ao salvar:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "URL necessária",
        description: "Configure a URL do webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Dados de teste realistas simulando um reset de senha
      const testPayload = {
        tipo: "password_reset",
        timestamp: new Date().toISOString(),
        participante: {
          nome: "João Silva (TESTE)",
          email: "teste@exemplo.com", 
          telefone: "11999887766"
        },
        reset_link: `${window.location.origin}/reset-password?token=test-token-123456`,
        expires_in: "1 hora",
        test_mode: true,
        message: "🧪 Este é um teste do webhook N8N - não envie este email/SMS para usuários reais!"
      };

      console.log("🧪 Enviando teste para N8N:", webhookUrl);
      console.log("📦 Payload:", JSON.stringify(testPayload, null, 2));

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      console.log("📡 Status da resposta:", response.status);
      console.log("📡 Response OK:", response.ok);

      if (response.ok) {
        const responseText = await response.text();
        console.log("📨 Resposta do N8N:", responseText);
        
        toast({
          title: "✅ Teste enviado com sucesso!",
          description: `Status: ${response.status}. Verifique os logs do N8N para confirmar o recebimento.`,
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error("❌ Erro detalhado:", error);
      
      let errorMessage = "Erro desconhecido ao enviar teste.";
      
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        errorMessage = "Erro de conectividade. Verifique se a URL está correta e acessível.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erro no teste do webhook",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !webhookUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook N8N
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando configuração...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook N8N - Reset de Senha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure a URL do webhook do N8N para envio automático de links de reset de senha via email, SMS ou WhatsApp.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="webhook-url">URL do Webhook N8N</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://seu-n8n.com/webhook/password-reset"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={saveConfiguration} 
            disabled={isSaving || !webhookUrl}
            className="flex-1"
          >
            {isSaving ? "Salvando..." : "Salvar Configuração"}
          </Button>
          <Button 
            onClick={testWebhook} 
            variant="outline"
            disabled={isLoading || !webhookUrl}
            className="px-6"
          >
            {isLoading ? "🧪 Testando..." : "🧪 Testar Conexão"}
          </Button>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Dados de teste enviados:</strong>
            <br />
            • participante: "João Silva (TESTE)" / "teste@exemplo.com" / "11999887766"
            <br />
            • reset_link: link de exemplo com token de teste
            <br />
            • test_mode: true (indica que é teste)
            <br />
            • ⚠️ Não envie emails/SMS reais com dados de teste!
          </AlertDescription>
        </Alert>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payload enviado para o N8N:</strong>
            <br />
            • tipo: "password_reset"
            <br />
            • timestamp: data/hora atual
            <br />
            • participante: &#123;nome, email, telefone&#125;
            <br />
            • reset_link: link completo com token
            <br />
            • expires_in: "1 hora"
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WebhookN8NConfiguration;